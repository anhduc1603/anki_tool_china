"""Dung file .apkg tu danh sach tu (dung chung cho web app va cong cu dong lenh)."""

import os

import genanki

from ankitool.constants.anki import DECK_ID
from ankitool.integrations import tts
from ankitool.integrations.anki.card_template import MODEL


def build_apkg(words, media_dir: str, output_path: str, deck_name: str):
    """Tao file .apkg tu danh sach tu.

    words: list[dict] voi cac key:
        hanzi, pinyin, meaning, example (str)
        mnemonic_path (duong dan tuyet doi toi anh goi nho, hoac None/"")
        gif_path (duong dan tuyet doi toi file gif net viet, hoac None/"")
    """
    deck = genanki.Deck(DECK_ID, deck_name)
    media_files = []
    seen_media = set()

    def add_media(path):
        if path not in seen_media:
            media_files.append(path)
            seen_media.add(path)

    for w in words:
        hanzi = (w.get("hanzi") or "").strip()
        if not hanzi:
            continue
        pinyin = (w.get("pinyin") or "").strip()
        meaning = (w.get("meaning") or "").strip()
        example = (w.get("example") or "").strip()
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

        note = genanki.Note(
            model=MODEL,
            fields=[hanzi, pinyin, audio_field, meaning, example, mnemonic_field, gif_field],
        )
        deck.add_note(note)

    package = genanki.Package(deck)
    package.media_files = media_files
    package.write_to_file(output_path)
