"""Hang so cho cai dat "Thoi gian on lai" (thoi gian cho tung muc cham cua tu dang hoc)."""

SETTING_REVIEW_TIMING = "review_timing"

REVIEW_TIMING_GRADES = ("again", "hard", "good", "easy")
TIMING_UNIT_SECONDS = {"second": 1, "minute": 60, "hour": 3600, "day": 86400}

# Don vi va gia tri nho nhat cho phep theo tung muc: chi Again duoc dung "giay" va gia tri 0
# (0 = quay lai ngay, khong cho). Hard/Good/Easy giu nguyen: phut/gio/ngay, so >= 1.
TIMING_UNITS_BY_GRADE = {
    "again": ("second", "minute", "hour", "day"),
    "hard": ("minute", "hour", "day"),
    "good": ("minute", "hour", "day"),
    "easy": ("minute", "hour", "day"),
}
TIMING_MIN_VALUE_BY_GRADE = {"again": 0, "hard": 1, "good": 1, "easy": 1}
MAX_TIMING_SECONDS = 365 * 86400

DEFAULT_REVIEW_TIMING = {
    "again": {"value": 1, "unit": "minute"},
    "hard": {"value": 6, "unit": "minute"},
    "good": {"value": 10, "unit": "minute"},
    "easy": {"value": 4, "unit": "day"},
}
