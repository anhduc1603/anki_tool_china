"""
Mau the Anki: CSS va model (field, template). Giu nguyen noi dung de the da nhap vao Anki
khong bi doi kieu; doi MODEL_ID/ten field/template se tao kieu the moi trong Anki.
"""

import genanki

from ankitool.constants.anki import MODEL_ID, MODEL_NAME

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
    MODEL_NAME,
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
