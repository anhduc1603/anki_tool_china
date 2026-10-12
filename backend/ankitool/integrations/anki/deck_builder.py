"""Dung file .apkg tu danh sach tu (dung chung cho web app va cong cu dong lenh)."""

import os
import zlib

import genanki

from ankitool.constants.anki import DECK_ID, LEGACY_DECK_NAMES
from ankitool.integrations import tts
from ankitool.integrations.anki.card_template import MODEL
from ankitool.integrations.anki.field_html import example_html, pinyin_html
from ankitool.utils.pinyin import spoken_text


def deck_id_for(deck_name: str) -> int:
    """Moi ten deck 1 id on dinh (de xuat tung danh muc thanh deck rieng trong Anki thay vi tron vao 1 deck);
    ten mac dinh giu DECK_ID cu de khong tach bo the da nhap truoc day."""
    if deck_name in LEGACY_DECK_NAMES:
        return DECK_ID
    return (1 << 30) | zlib.crc32(deck_name.encode("utf-8"))


def build_apkg(words, media_dir: str, output_path: str, deck_name: str):
    """Tao file .apkg tu danh sach tu.

    words: list[dict] voi cac key:
        hanzi, pinyin, meaning, example, example_pinyin (str; example_pinyin tuy chon)
        mnemonic_path (duong dan tuyet doi toi anh goi nho, hoac None/"")
        gif_path (duong dan tuyet doi toi file gif net viet, hoac None/"")
    """
    deck = genanki.Deck(deck_id_for(deck_name), deck_name)
    media_files = []
    seen_media = set()

    def add_media(path):
        if path not in seen_media:
            media_files.append(path)
            seen_media.add(path)

    # Audio cau vi du (phan tieng Trung): sinh het mot luot, song song; cau nao khong sinh duoc thi the do
    # khong co am thanh cau (khong lam hong ca lan xuat).
    spoken_by_word = [
        spoken_text((w.get("example") or "").strip()) if (w.get("hanzi") or "").strip() else "" for w in words
    ]
    example_audio = tts.ensure_audio_many(spoken_by_word, media_dir)

    for w, spoken in zip(words, spoken_by_word):
        hanzi = (w.get("hanzi") or "").strip()
        if not hanzi:
            continue
        pinyin = (w.get("pinyin") or "").strip()
        meaning = (w.get("meaning") or "").strip()
        example = (w.get("example") or "").strip()
        example_pinyin = (w.get("example_pinyin") or "").strip()
        mnemonic_path = w.get("mnemonic_path") or ""
        gif_path = w.get("gif_path") or ""

        audio_path = tts.ensure_audio(hanzi, media_dir)
        add_media(audio_path)
        audio_field = f"[sound:{os.path.basename(audio_path)}]"

        mnemonic_field = ""
        if mnemonic_path and os.path.exists(mnemonic_path):
            add_media(mnemonic_path)
            mnemonic_field = f'<img src="{os.path.basename(mnemonic_path)}">'

        gif_field = ""
        if gif_path and os.path.exists(gif_path):
            add_media(gif_path)
            gif_field = f'<img src="{os.path.basename(gif_path)}">'

        example_sound = ""
        example_audio_path = example_audio.get(spoken) if spoken else None
        if example_audio_path:
            add_media(example_audio_path)
            example_sound = f"[sound:{os.path.basename(example_audio_path)}]"

        # GUID tinh tu cac gia tri goc (thuan van ban) nhu truoc khi co pinyin mau: tu chua sua giu nguyen
        # danh tinh, nhap lai vao Anki cap nhat the cu thay vi tao the trung.
        guid = genanki.guid_for(hanzi, pinyin, audio_field, meaning, example, mnemonic_field, gif_field)
        note = genanki.Note(
            model=MODEL,
            fields=[
                hanzi,
                pinyin_html(pinyin),
                audio_field,
                meaning,
                example_html(example, example_pinyin, example_sound),
                mnemonic_field,
                gif_field,
            ],
            guid=guid,
        )
        deck.add_note(note)

    package = genanki.Package(deck)
    package.media_files = media_files
    package.write_to_file(output_path)
