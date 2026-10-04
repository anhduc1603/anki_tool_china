"""Hang so cho cai dat "Thoi gian on lai" (thoi gian cho tung muc cham cua tu dang hoc)."""

SETTING_REVIEW_TIMING = "review_timing"

REVIEW_TIMING_GRADES = ("again", "hard", "good", "easy")
TIMING_UNIT_SECONDS = {"minute": 60, "hour": 3600, "day": 86400}
MAX_TIMING_SECONDS = 365 * 86400

DEFAULT_REVIEW_TIMING = {
    "again": {"value": 1, "unit": "minute"},
    "hard": {"value": 6, "unit": "minute"},
    "good": {"value": 10, "unit": "minute"},
    "easy": {"value": 4, "unit": "day"},
}
