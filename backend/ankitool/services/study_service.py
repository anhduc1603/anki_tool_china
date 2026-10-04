"""
Phien hoc: tu den han (kem nhan thoi gian cho tung muc cham), dem New/Learn/Due,
va cham diem. Luat SM-2 nam o scheduler.py; thoi gian hoc tuy chinh o settings_service.
"""

from ankitool.constants import messages
from ankitool.constants.scopes import UNCATEGORIZED
from ankitool.constants.srs import GRADES
from ankitool.errors import NotFoundError, ValidationError
from ankitool.repositories import category_repository, word_repository
from ankitool.services import scheduler, settings_service
from ankitool.utils.clock import due_after, now_iso


def _list_due(scope):
    """scope: None/"" = tat ca; "uncategorized" = tu chua phan loai;
    id danh muc con = chi danh muc do; id danh muc cha = tat ca danh muc con."""
    now = now_iso()
    if scope == UNCATEGORIZED:
        return word_repository.list_due(now, uncategorized_only=True)
    if scope:
        category = category_repository.get(scope)
        if category is None:
            return []
        if category["parent_id"] is None:
            child_ids = category_repository.list_child_ids(scope)
            if not child_ids:
                return []
            return word_repository.list_due(now, category_ids=child_ids)
        return word_repository.list_due(now, category_ids=[scope])
    return word_repository.list_due(now)


def get_due_words(scope=None):
    words = _list_due(scope)
    timing = settings_service.review_timing_seconds()
    for word in words:
        word["next_intervals"] = scheduler.next_intervals(word, timing)
    return words


def get_due_counts():
    """Dem tu den han ngay bay gio theo New/Learn/Due cho tung danh muc.

    New = chua on lan nao (reviewed=0); Learn = da on nhung con o giai doan hoc
    (reviewed=1, repetitions=0); Due = da tot nghiep (repetitions>0).
    Danh muc cha = tong cac con.
    """
    rows = word_repository.count_due_grouped(now_iso())
    cats = category_repository.list_id_parent_pairs()

    def empty():
        return {"new": 0, "learn": 0, "due": 0}

    counts = {cid: empty() for cid, _ in cats}
    uncategorized = empty()

    for r in rows:
        target = uncategorized if r["category_id"] is None else counts.get(r["category_id"])
        if target is None:
            continue
        target["new"] += r["n"]
        target["learn"] += r["l"]
        target["due"] += r["d"]

    for cid, parent_id in cats:
        if parent_id is not None and parent_id in counts:
            for key, value in counts[cid].items():
                counts[parent_id][key] += value

    return {"categories": counts, "uncategorized": uncategorized}


def review(word_id, grade):
    if grade not in GRADES:
        raise ValidationError(messages.INVALID_GRADE)
    word = word_repository.get(word_id)
    if word is None:
        raise NotFoundError(messages.WORD_NOT_FOUND)

    timing = settings_service.review_timing_seconds()
    ease_factor, interval_days, repetitions, delay = scheduler.schedule_next(
        word["ease_factor"], word["interval_days"], word["repetitions"], grade, timing
    )
    due_at = due_after(delay)
    word_repository.update(
        word_id,
        {
            "ease_factor": ease_factor,
            "interval_days": interval_days,
            "repetitions": repetitions,
            "due_at": due_at,
            "reviewed": 1,
        },
    )

    updated = word_repository.get(word_id)
    updated["next_intervals"] = scheduler.next_intervals(updated, timing)
    return {
        "ease_factor": ease_factor,
        "interval_days": interval_days,
        "repetitions": repetitions,
        "due_at": due_at,
        "seconds_until_due": delay,
        "word": updated,
    }
