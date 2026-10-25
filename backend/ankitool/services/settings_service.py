"""
Cai dat nguoi dung (global): gia tri mac dinh, kiem tra hop le, doc/ghi.
Moi muc cai dat la 1 khoa trong bang settings (xem repositories/setting_repository.py);
them cai dat moi = them khoa + ham kiem tra vao _VALIDATORS.
"""

import json

from ankitool.constants import messages
from ankitool.constants.review_settings import (
    DEFAULT_REVIEW_TIMING,
    MAX_TIMING_SECONDS,
    REVIEW_TIMING_GRADES,
    SETTING_REVIEW_TIMING,
    TIMING_MIN_VALUE_BY_GRADE,
    TIMING_UNIT_SECONDS,
    TIMING_UNITS_BY_GRADE,
)
from ankitool.constants.study_settings import (
    AUTO_ADVANCE_ACTIONS,
    AUTO_ADVANCE_KEYS,
    AUTO_ADVANCE_MAX_SECONDS,
    AUTO_ADVANCE_SECONDS_KEYS,
    DEFAULT_STUDY_AUTO_ADVANCE,
    DEFAULT_STUDY_AUTOPLAY,
    DEFAULT_STUDY_TYPE_ANSWER,
    SETTING_STUDY_AUTO_ADVANCE,
    SETTING_STUDY_AUTOPLAY,
    SETTING_STUDY_TYPE_ANSWER,
    STUDY_AUTOPLAY_KEYS,
)
from ankitool.errors import ValidationError
from ankitool.repositories import setting_repository


def default_settings():
    return {
        SETTING_REVIEW_TIMING: json.loads(json.dumps(DEFAULT_REVIEW_TIMING)),
        SETTING_STUDY_AUTOPLAY: dict(DEFAULT_STUDY_AUTOPLAY),
        SETTING_STUDY_AUTO_ADVANCE: dict(DEFAULT_STUDY_AUTO_ADVANCE),
        SETTING_STUDY_TYPE_ANSWER: dict(DEFAULT_STUDY_TYPE_ANSWER),
    }


def _timing_item_error(grade, item):
    if not isinstance(item, dict):
        return messages.TIMING_ITEM_INVALID.format(grade=grade)
    value, unit = item.get("value"), item.get("unit")
    min_value = TIMING_MIN_VALUE_BY_GRADE[grade]
    allows_seconds = "second" in TIMING_UNITS_BY_GRADE[grade]  # chi Again: thong bao rieng (nhac giay / tu 0)
    if isinstance(value, bool) or not isinstance(value, int) or value < min_value:
        message = messages.TIMING_VALUE_INVALID_AGAIN if allows_seconds else messages.TIMING_VALUE_INVALID
        return message.format(grade=grade)
    if unit not in TIMING_UNITS_BY_GRADE[grade]:
        message = messages.TIMING_UNIT_INVALID_AGAIN if allows_seconds else messages.TIMING_UNIT_INVALID
        return message.format(grade=grade)
    if value * TIMING_UNIT_SECONDS[unit] > MAX_TIMING_SECONDS:
        return messages.TIMING_TOO_LONG.format(grade=grade)
    return None


def _validate_review_timing(section):
    """Tra ve (section da lam sach, loi). Phai co du 4 muc, khong thua khoa la."""
    if not isinstance(section, dict) or set(section) != set(REVIEW_TIMING_GRADES):
        return None, messages.TIMING_INCOMPLETE
    clean = {}
    for grade in REVIEW_TIMING_GRADES:
        err = _timing_item_error(grade, section[grade])
        if err:
            return None, err
        clean[grade] = {"value": section[grade]["value"], "unit": section[grade]["unit"]}
    return clean, None


def _validate_study_autoplay(section):
    """Dung hai cong tat word/example, moi cong tat la bool that (khong nhan 0/1, chuoi, null)."""
    if not isinstance(section, dict) or set(section) != set(STUDY_AUTOPLAY_KEYS):
        return None, messages.STUDY_AUTOPLAY_INVALID
    if not all(isinstance(section[key], bool) for key in STUDY_AUTOPLAY_KEYS):
        return None, messages.STUDY_AUTOPLAY_INVALID
    return {key: section[key] for key in STUDY_AUTOPLAY_KEYS}, None


def _validate_study_auto_advance(section):
    """Dung 4 khoa: hai so giay (int that 0..3600), hanh dong hop le, cong tat cho am thanh (bool that)."""
    if not isinstance(section, dict) or set(section) != set(AUTO_ADVANCE_KEYS):
        return None, messages.STUDY_AUTO_ADVANCE_INVALID
    for key in AUTO_ADVANCE_SECONDS_KEYS:
        value = section[key]
        if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= AUTO_ADVANCE_MAX_SECONDS:
            return None, messages.STUDY_AUTO_ADVANCE_INVALID
    if section["answer_action"] not in AUTO_ADVANCE_ACTIONS or not isinstance(section["wait_for_audio"], bool):
        return None, messages.STUDY_AUTO_ADVANCE_INVALID
    return {key: section[key] for key in AUTO_ADVANCE_KEYS}, None


def _validate_study_type_answer(section):
    if not isinstance(section, dict) or set(section) != {"enabled"} or not isinstance(section["enabled"], bool):
        return None, messages.STUDY_TYPE_ANSWER_INVALID
    return {"enabled": section["enabled"]}, None


_VALIDATORS = {
    SETTING_REVIEW_TIMING: _validate_review_timing,
    SETTING_STUDY_AUTOPLAY: _validate_study_autoplay,
    SETTING_STUDY_AUTO_ADVANCE: _validate_study_auto_advance,
    SETTING_STUDY_TYPE_ANSWER: _validate_study_type_answer,
}


def get_settings():
    """Gia tri da luu de len gia tri mac dinh; hong/thieu thi dung mac dinh."""
    settings = default_settings()
    for key, raw in setting_repository.get_all().items():
        if key not in _VALIDATORS:
            continue
        try:
            clean, err = _VALIDATORS[key](json.loads(raw))
        except ValueError:
            continue
        if err is None:
            settings[key] = clean
    return settings


def update_settings(partial):
    """partial: {ten_muc: gia_tri}. Hop le het moi luu, sai 1 muc thi khong luu gi."""
    if not isinstance(partial, dict) or not partial:
        raise ValidationError(messages.NOTHING_TO_SAVE)
    cleaned = {}
    for key, section in partial.items():
        if key not in _VALIDATORS:
            raise ValidationError(messages.UNKNOWN_SETTING.format(key=key))
        clean, err = _VALIDATORS[key](section)
        if err:
            raise ValidationError(err)
        cleaned[key] = clean
    setting_repository.upsert_many({key: json.dumps(clean) for key, clean in cleaned.items()})
    return get_settings()


def review_timing_seconds():
    """Thoi gian cho moi muc cham, tinh bang giay."""
    timing = get_settings()[SETTING_REVIEW_TIMING]
    return {g: timing[g]["value"] * TIMING_UNIT_SECONDS[timing[g]["unit"]] for g in timing}
