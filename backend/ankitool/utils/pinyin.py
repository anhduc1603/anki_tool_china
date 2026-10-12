"""
Pinyin cua cau vi du: tach am tiet, doc thanh dieu, ghep tung chu Han voi am tiet.
Khong import flask/DB. Quy tac phai giong frontend/js/shared/pinyin.js (kiem thu chung 1 bo vi du).

Quy tac ghep: chi cac chu Han (CJK) nam NGOAI ngoac () hoac （） duoc chu am, theo thu tu,
moi chu mot am tiet. Moi ky tu khac (dau cau, so, chu Latin, xuong dong, noi dung trong ngoac)
giu nguyen.
"""

import unicodedata

from ankitool.constants.pinyin import NEUTRAL_TONE

_OPEN = "(（"
_CLOSE = ")）"
_TONE_MARKS = {"̄": 1, "́": 2, "̌": 3, "̀": 4}


class PinyinMismatch(ValueError):
    """So am tiet khong bang so chu Han can chu am."""

    def __init__(self, chars, syllables):
        super().__init__(f"{chars} chu Han, {syllables} am tiet")
        self.chars = chars
        self.syllables = syllables


class PinyinInvalid(ValueError):
    """Pinyin chua ky tu khong phai chu cai pinyin (chu so, chu Han, dau cau...)."""

    def __init__(self, token):
        super().__init__(f"am tiet khong hop le: {token}")
        self.token = token


def is_cjk(ch):
    return "㐀" <= ch <= "䶿" or "一" <= ch <= "鿿"


def tone_of(syllable):
    """1..4 theo dau thanh; khong co dau -> thanh nhe (5)."""
    for ch in unicodedata.normalize("NFD", syllable):
        if ch in _TONE_MARKS:
            return _TONE_MARKS[ch]
    return NEUTRAL_TONE


def _valid_syllable(token):
    return all((ch.isalpha() and not is_cjk(ch)) or ch in "'’" for ch in token)


def split_syllables(text):
    """Chuoi pinyin -> danh sach am tiet (NFC, tach theo khoang trang). Rong -> [].
    Co ky tu khong phai chu cai (chu so, chu Han, dau cau) -> PinyinInvalid."""
    tokens = unicodedata.normalize("NFC", text or "").split()
    for token in tokens:
        if not _valid_syllable(token):
            raise PinyinInvalid(token)
    return tokens


def annotatable_indexes(example):
    """Vi tri cac chu Han can chu am (ngoai ngoac) trong cau vi du."""
    depth = 0
    indexes = []
    for i, ch in enumerate(example or ""):
        if ch in _OPEN:
            depth += 1
        elif ch in _CLOSE:
            depth = max(0, depth - 1)
        elif depth == 0 and is_cjk(ch):
            indexes.append(i)
    return indexes


def spoken_text(example):
    """Van ban tieng Trung de doc to: moi thu NGOAI ngoac () / （）, khoang trang va xuong dong gop thanh 1 dau cach.
    Khong co chu Han nao ngoai ngoac -> "" (khong co gi de doc)."""
    depth = 0
    kept = []
    has_cjk = False
    for ch in example or "":
        if ch in _OPEN:
            depth += 1
        elif ch in _CLOSE:
            depth = max(0, depth - 1)
        elif depth == 0:
            kept.append(ch)
            has_cjk = has_cjk or is_cjk(ch)
    return " ".join("".join(kept).split()) if has_cjk else ""


def align(example, syllables):
    """Ghep chu Han voi am tiet -> [(van_ban, am_tiet_hoac_None)]: moi chu Han duoc chu am la 1 muc rieng,
    cac ky tu khac duoc gop thanh 1 doan (am_tiet None). Khong khop so luong -> PinyinMismatch."""
    example = example or ""
    indexes = annotatable_indexes(example)
    if len(indexes) != len(syllables):
        raise PinyinMismatch(len(indexes), len(syllables))
    by_index = dict(zip(indexes, syllables))
    segments = []
    plain = []
    for i, ch in enumerate(example):
        if i in by_index:
            if plain:
                segments.append(("".join(plain), None))
                plain = []
            segments.append((ch, by_index[i]))
        else:
            plain.append(ch)
    if plain:
        segments.append(("".join(plain), None))
    return segments
