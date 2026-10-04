"""Hang so cho on tap cach quang (SM-2)."""

GRADES = ("again", "hard", "good", "easy")
QUALITY = {"again": 1, "hard": 3, "good": 4, "easy": 5}
MAX_QUALITY = 5

DEFAULT_EASE_FACTOR = 2.5
MIN_EASE_FACTOR = 1.3

# ease moi = ease + (EASE_BASE - (5 - q) * (EASE_PENALTY_LINEAR + (5 - q) * EASE_PENALTY_QUADRATIC))
EASE_BASE = 0.1
EASE_PENALTY_LINEAR = 0.08
EASE_PENALTY_QUADRATIC = 0.02

DAY_SECONDS = 86400

# Khoang cach (ngay) cua tu da "tot nghiep"
SECOND_REPETITION_MIN_DAYS = 6  # lan nho thu 2 (repetitions == 1): toi thieu 6 ngay
HARD_INTERVAL_MULTIPLIER = 1.2
EASY_INTERVAL_MULTIPLIER = 1.3
