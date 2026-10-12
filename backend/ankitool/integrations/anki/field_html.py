"""
HTML cho cac truong cua the Anki: pinyin co mau theo thanh dieu va cau vi du dang ruby co nut An/Hien pinyin.

Dung style noi tuyen (khong sua CSS cua kieu the) vi Anki khong chac cap nhat CSS cua kieu the da nhap;
nut An/Hien dung thu thuat checkbox (giong nut xem net viet) nen khong can JS.
Ket qua cua cac ham nay chi la noi dung truong; khong doi MODEL_ID/truong/template.
"""

from html import escape

from ankitool.constants.pinyin import TONE_COLORS
from ankitool.utils import pinyin as pinyin_utils

# id cua checkbox: moi the chi hien 1 cau vi du nen khong bi trung
_TOGGLE_ID = "exPinyin"

# Khong dung display cho <rt>: `display:ruby-text` chi hop le o Chromium moi, ban cu trong Anki bo qua khai bao
# do va pinyin khong bao gio hien. An bang co chu 0 + visibility, hien bang co chu thuong.
_EXAMPLE_STYLE = (
    ".ex-text rt{font-size:0;visibility:hidden;}"
    f"#{_TOGGLE_ID}:checked ~ .ex-text rt{{font-size:0.6em;visibility:visible;}}"
    ".ex-hide{display:none;}"
    f"#{_TOGGLE_ID}:checked ~ label .ex-show{{display:none;}}"
    f"#{_TOGGLE_ID}:checked ~ label .ex-hide{{display:inline;}}"
)
_LABEL_STYLE = (
    "display:inline-block;margin-top:6px;background:#eef2f7;color:#2b6cb0;"
    "padding:6px 14px;border-radius:999px;cursor:pointer;font-size:14px;"
)


def _color(syllable):
    return TONE_COLORS[pinyin_utils.tone_of(syllable)]


def pinyin_html(pinyin):
    """Pinyin cua tu chinh: moi am tiet (cach nhau dau cach) 1 mau theo thanh."""
    tokens = (pinyin or "").split()
    return " ".join(f'<span style="color:{_color(t)}">{escape(t)}</span>' for t in tokens)


def _with_sound(text, sound_tag):
    return f"{text}<br>{sound_tag}" if sound_tag else text


def example_html(example, example_pinyin, sound_tag=""):
    """Truong Example: co pinyin khop chu Han -> khoi ruby co mau + nut An/Hien (pinyin an mac dinh);
    khong co/khong khop -> giu nguyen chuoi example nhu truoc. sound_tag ("[sound:...]" cua cau vi du)
    duoc dat canh nut An/Hien (khoi ruby) hoac xuong dong duoi chuoi thuong; khong co thi khong doi gi."""
    try:
        syllables = pinyin_utils.split_syllables(example_pinyin)
        if not syllables:
            return _with_sound(example, sound_tag)
        segments = pinyin_utils.align(example, syllables)
    except ValueError:  # PinyinInvalid / PinyinMismatch
        return _with_sound(example, sound_tag)

    parts = []
    for text, syllable in segments:
        if syllable:
            parts.append(
                f'<ruby style="color:{_color(syllable)}">{escape(text)}<rt>{escape(syllable)}</rt></ruby>'
            )
        else:
            parts.append(escape(text))
    return (
        f'<input type="checkbox" id="{_TOGGLE_ID}" style="display:none">'
        f'<div class="ex-text" style="white-space:pre-line;line-height:1.5;">{"".join(parts)}</div>'
        f'<label for="{_TOGGLE_ID}" class="tappable" style="{_LABEL_STYLE}">'
        '<span class="ex-show">🔤 Hiện pinyin</span><span class="ex-hide">🙈 Ẩn pinyin</span></label>'
        f"{sound_tag}"
        f"<style>{_EXAMPLE_STYLE}</style>"
    )
