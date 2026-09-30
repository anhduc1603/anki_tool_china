"""
Logic tao Anki deck (.apkg) dung chung cho CLI script (generate_anki.py)
va web app (app.py).
"""

import asyncio
import hashlib
import os

import edge_tts
import genanki

MODEL_ID = 1957834030  # doi ID vi doi schema field (them Mnemonic, an Gif sau nut bam)
DECK_ID = 1957834022

VOICE = "zh-CN-XiaoxiaoNeural"  # giong nu chuan Bac Kinh, doc ro rang

CARD_CSS = """
.card {
    font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
    text-align: center;
    background-color: #fafafa;
    color: #222;
    padding: 20px;
}
.hanzi {
    font-size: 64px;
    font-weight: bold;
    margin-bottom: 8px;
}
.pinyin {
    font-size: 26px;
    color: #2b6cb0;
    margin-bottom: 12px;
}
hr {
    border: none;
    border-top: 1px solid #ccc;
    margin: 16px 0;
}
.meaning {
    font-size: 28px;
    font-weight: bold;
    color: #22863a;
    margin-bottom: 10px;
}
.example {
    font-size: 20px;
    color: #444;
    margin-bottom: 14px;
}
.mnemonic img {
    max-width: 260px;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin-bottom: 14px;
}

/* Nut an/hien GIF net viet - dung thu thuat checkbox, khong can JS
   nen chay dung tren moi nen tang Anki (desktop/AnkiDroid/AnkiMobile). */
.toggle-checkbox {
    display: none;
}
.toggle-label {
    display: inline-block;
    background: #eef2f7;
    color: #2b6cb0;
    padding: 8px 16px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 14px;
}
.toggle-label .hide-text { display: none; }
.toggle-checkbox:checked ~ .toggle-label .show-text { display: none; }
.toggle-checkbox:checked ~ .toggle-label .hide-text { display: inline; }

.gif-content {
    display: none;
    margin-top: 14px;
}
.toggle-checkbox:checked ~ .gif-content {
    display: block;
}
.gif-content img {
    max-width: 240px;
    border: 1px solid #ddd;
    border-radius: 8px;
}
"""

MODEL = genanki.Model(
    MODEL_ID,
    "Chinese Flashcard (AnkiTool)",
    fields=[
        {"name": "Hanzi"},
        {"name": "Pinyin"},
        {"name": "Audio"},
        {"name": "Meaning"},
        {"name": "Example"},
        {"name": "Mnemonic"},
        {"name": "Gif"},
    ],
    templates=[
        {
            "name": "Card 1",
            "qfmt": (
                '<div class="hanzi">{{Hanzi}}</div>'
                '<div class="pinyin">{{Pinyin}}</div>'
                "{{Audio}}"
            ),
            "afmt": (
                "{{FrontSide}}"
                "<hr>"
                '<div class="meaning">{{Meaning}}</div>'
                '{{#Example}}<div class="example">{{Example}}</div>{{/Example}}'
                '{{#Mnemonic}}<div class="mnemonic">{{Mnemonic}}</div>{{/Mnemonic}}'
                "{{#Gif}}"
                '<input type="checkbox" id="toggle-gif" class="toggle-checkbox">'
                '<label for="toggle-gif" class="toggle-label tappable">'
                '<span class="show-text">✍️ Xem cách viết nét</span>'
                '<span class="hide-text">🙈 Ẩn cách viết nét</span>'
                "</label>"
                '<div class="gif-content">{{Gif}}</div>'
                "{{/Gif}}"
            ),
        },
    ],
    css=CARD_CSS,
)


def audio_filename_for(text: str) -> str:
    h = hashlib.md5(text.encode("utf-8")).hexdigest()[:10]
    return f"{h}.mp3"


async def _synthesize_audio(text: str, out_path: str):
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(out_path)


def ensure_audio(text: str, media_dir: str) -> str:
    """Sinh (neu chua co san) audio phat am cho `text`, tra ve duong dan file.

    Cache theo hash cua text nen cung mot tu chi sinh audio 1 lan.
    """
    os.makedirs(media_dir, exist_ok=True)
    filename = audio_filename_for(text)
    out_path = os.path.join(media_dir, filename)
    if not os.path.exists(out_path):
        asyncio.run(_synthesize_audio(text, out_path))
    return out_path


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

        audio_path = ensure_audio(hanzi, media_dir)
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
