"""Truy van SQL cho bang words. Khong chua luat nghiep vu."""

from ankitool.constants.srs import DEFAULT_EASE_FACTOR
from ankitool.database.connection import connect
from ankitool.utils.clock import today_iso

WORD_FIELDS = (
    "id",
    "hanzi",
    "pinyin",
    "meaning",
    "example",
    "mnemonic_filename",
    "gif_filename",
    "audio_filename",
    "category_id",
    "ease_factor",
    "interval_days",
    "repetitions",
    "due_at",
    "reviewed",
)


def _row_to_word(row):
    return {field: row[field] for field in WORD_FIELDS}


def list_all():
    with connect() as conn:
        rows = conn.execute("SELECT * FROM words ORDER BY position").fetchall()
        return [_row_to_word(r) for r in rows]


def get(word_id):
    with connect() as conn:
        row = conn.execute("SELECT * FROM words WHERE id = ?", (word_id,)).fetchone()
        return _row_to_word(row) if row else None


def exists(word_id):
    with connect() as conn:
        return conn.execute("SELECT id FROM words WHERE id = ?", (word_id,)).fetchone() is not None


def insert(word):
    with connect() as conn:
        next_position = conn.execute(
            "SELECT COALESCE(MAX(position), -1) + 1 FROM words"
        ).fetchone()[0]
        conn.execute(
            """
            INSERT INTO words
                (id, hanzi, pinyin, meaning, example, mnemonic_filename, gif_filename, audio_filename,
                 position, category_id, ease_factor, interval_days, repetitions, due_at, reviewed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                word["id"],
                word["hanzi"],
                word["pinyin"],
                word["meaning"],
                word.get("example", ""),
                word.get("mnemonic_filename"),
                word.get("gif_filename"),
                word.get("audio_filename"),
                next_position,
                word.get("category_id"),
                word.get("ease_factor", DEFAULT_EASE_FACTOR),
                word.get("interval_days", 0),
                word.get("repetitions", 0),
                word.get("due_at") or today_iso(),
                word.get("reviewed", 0),
            ),
        )


def update(word_id, fields):
    """fields: dict chi chua cac cot muon cap nhat (tru id/position)."""
    if not fields:
        return
    columns = ", ".join(f"{key} = ?" for key in fields)
    values = list(fields.values()) + [word_id]
    with connect() as conn:
        conn.execute(f"UPDATE words SET {columns} WHERE id = ?", values)


def delete(word_id):
    with connect() as conn:
        cur = conn.execute("DELETE FROM words WHERE id = ?", (word_id,))
        return cur.rowcount > 0


def set_category(word_id, category_id):
    with connect() as conn:
        conn.execute("UPDATE words SET category_id = ? WHERE id = ?", (category_id, word_id))


def count_in_category(category_id):
    with connect() as conn:
        return conn.execute(
            "SELECT COUNT(*) FROM words WHERE category_id = ?", (category_id,)
        ).fetchone()[0]


def list_due(now_iso, category_ids=None, uncategorized_only=False):
    """Tu co due_at <= now_iso. category_ids: chi lay cac danh muc nay (list khong rong);
    uncategorized_only: chi tu chua phan loai. Sap xep theo position."""
    sql = "SELECT * FROM words WHERE due_at <= ?"
    params = [now_iso]
    if uncategorized_only:
        sql += " AND category_id IS NULL"
    elif category_ids is not None:
        sql += f" AND category_id IN ({','.join('?' * len(category_ids))})"
        params += list(category_ids)
    with connect() as conn:
        rows = conn.execute(sql + " ORDER BY position", params).fetchall()
        return [_row_to_word(r) for r in rows]


def count_due_grouped(now_iso):
    """Dem tu den han theo category_id: cot n (New), l (Learn), d (Due)."""
    with connect() as conn:
        return conn.execute(
            """
            SELECT category_id,
                SUM(CASE WHEN reviewed = 0 AND repetitions = 0 THEN 1 ELSE 0 END) AS n,
                SUM(CASE WHEN reviewed = 1 AND repetitions = 0 THEN 1 ELSE 0 END) AS l,
                SUM(CASE WHEN repetitions > 0 THEN 1 ELSE 0 END) AS d
            FROM words WHERE due_at <= ? GROUP BY category_id
            """,
            (now_iso,),
        ).fetchall()
