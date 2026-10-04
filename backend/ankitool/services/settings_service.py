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
    TIMING_UNIT_SECONDS,
)
from ankitool.errors import ValidationError
from ankitool.repositories import setting_repository


def default_settings():
    return {SETTING_REVIEW_TIMING: json.loads(json.dumps(DEFAULT_REVIEW_TIMING))}


def _timing_item_error(grade, item):
    if not isinstance(item, dict):
        return messages.TIMING_ITEM_INVALID.format(grade=grade)
    value, unit = item.get("value"), item.get("unit")
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        return messages.TIMING_VALUE_INVALID.format(grade=grade)
    if unit not in TIMING_UNIT_SECONDS:
        return messages.TIMING_UNIT_INVALID.format(grade=grade)
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


_VALIDATORS = {SETTING_REVIEW_TIMING: _validate_review_timing}


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
