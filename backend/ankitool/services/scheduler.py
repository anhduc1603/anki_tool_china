"""
SM-2 + thoi gian hoc tuy chinh. Ham thuan: nhan so, tra so; khong doc DB hay cai dat
(study_service doc thoi gian cai dat roi truyen vao `timing`).
"""

from ankitool.constants import messages
from ankitool.constants.srs import (
    DAY_SECONDS,
    EASE_BASE,
    EASE_PENALTY_LINEAR,
    EASE_PENALTY_QUADRATIC,
    EASY_INTERVAL_MULTIPLIER,
    GRADES,
    HARD_INTERVAL_MULTIPLIER,
    MAX_QUALITY,
    MIN_EASE_FACTOR,
    QUALITY,
    SECOND_REPETITION_MIN_DAYS,
)


def passing_intervals(ease_factor, interval_days, repetitions):
    """Khoang cach (ngay) cho 3 muc dat cua tu da 'tot nghiep' (repetitions > 0):
    hard < good < easy khi du lon."""
    prev = interval_days
    if repetitions == 1:
        good = max(prev + 1, SECOND_REPETITION_MIN_DAYS)
    else:
        good = max(prev + 1, round(prev * ease_factor))
    hard = max(prev + 1, min(good - 1, round(prev * HARD_INTERVAL_MULTIPLIER)))
    easy = max(good + 1, round(good * EASY_INTERVAL_MULTIPLIER))
    return {"hard": hard, "good": good, "easy": easy}


def schedule_next(ease_factor, interval_days, repetitions, grade, timing):
    """4 muc cham: again/hard/good/easy.

    timing: giay cho tung muc. Tu dang hoc (repetitions == 0, tuc moi hoac vua quen)
    dung dung thoi gian da cai dat: again/hard giu nguyen trang thai hoc, good/easy
    cho 'tot nghiep' (repetitions = 1). Tu da tot nghiep: again quay ve trang thai
    hoc, con hard/good/easy tinh bang ngay theo SM-2.

    Tra ve (ease_factor, interval_days, repetitions, delay_giay).
    """
    if grade not in QUALITY:
        raise ValueError(messages.INVALID_GRADE_NAME.format(grade=grade))
    quality = QUALITY[grade]
    learning = repetitions == 0

    if grade == "again":
        repetitions, interval_days, delay = 0, 0, timing["again"]
    elif learning:
        delay = timing[grade]
        if grade == "hard":
            interval_days = 0
        else:
            repetitions = 1
            interval_days = max(1, round(delay / DAY_SECONDS))
    else:
        interval_days = passing_intervals(ease_factor, interval_days, repetitions)[grade]
        repetitions += 1
        delay = interval_days * DAY_SECONDS

    # Dang hoc (again/hard khi chua tot nghiep) khong tru do kho, de bam lap lai
    # trong phien khong lam ease tut ve muc san.
    if not (learning and grade in ("again", "hard")):
        gap = MAX_QUALITY - quality
        ease_factor = round(
            max(MIN_EASE_FACTOR, ease_factor + (EASE_BASE - gap * (EASE_PENALTY_LINEAR + gap * EASE_PENALTY_QUADRATIC))),
            2,
        )
    return ease_factor, interval_days, repetitions, delay


def next_intervals(word, timing):
    """So giay den lan on ke tiep cho tung muc cham (dung chung schedule_next
    nen nhan hien tren nut luon khop ket qua that)."""
    return {
        grade: schedule_next(
            word["ease_factor"], word["interval_days"], word["repetitions"], grade, timing
        )[3]
        for grade in GRADES
    }
