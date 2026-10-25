"""Truy van SQL cho bang words. Khong chua luat nghiep vu."""

import json

from ankitool.constants.srs import DEFAULT_EASE_FACTOR
from ankitool.database.connection import connect
from ankitool.utils.clock import today_iso

WORD_FIELDS = (
    "id",
    "hanzi",
    "pinyin",
    "meaning",
    "example",
    "example_pinyin",
    "mnemonic_filename",
    "mnemonic_credit",
    "gif_filename",
    "audio_filename",
    "category_id",
    "ease_factor",
    "interval_days",
    "repetitions",
    "due_at",
    "reviewed",
    "buried_until",
)


_IN_CHUNK = 500  # so bien toi da moi cau IN (...)


def _credit_to_dict(raw):
    """Cot mnemonic_credit luu JSON; tra dict (hoac None neu rong/hong)."""
    if not raw:
        return None
    try:
        value = json.loads(raw)
    except ValueError:
        return None
    return value if isinstance(value, dict) else None


def _row_to_word(row):
    word = {field: row[field] for field in WORD_FIELDS}
    word["mnemonic_credit"] = _credit_to_dict(word["mnemonic_credit"])
    return word


def list_all():
    return list_in_scope()


def list_in_scope(category_ids=None, uncategorized_only=False):
    """Tu theo thu tu position. uncategorized_only: chi tu chua phan loai; category_ids: chi cac danh muc
    nay ([] -> khong co tu nao); ca hai mac dinh -> tat ca."""
    sql = "SELECT * FROM words"
    params = []
    if uncategorized_only:
        sql += " WHERE category_id IS NULL"
    elif category_ids is not None:
        if not category_ids:
            return []
        sql += f" WHERE category_id IN ({','.join('?' * len(category_ids))})"
        params = list(category_ids)
    with connect() as conn:
        rows = conn.execute(sql + " ORDER BY position", params).fetchall()
        return [_row_to_word(r) for r in rows]


def get(word_id):
    with connect() as conn:
        row = conn.execute("SELECT * FROM words WHERE id = ?", (word_id,)).fetchone()
        return _row_to_word(row) if row else None


def exists(word_id):
    with connect() as conn:
        return conn.execute("SELECT id FROM words WHERE id = ?", (word_id,)).fetchone() is not None


def find_existing_hanzi(hanzis):
    """Tap chu Han (trong `hanzis`) da co trong bang words. Chia nhom de khong vuot gioi han bien cua SQLite."""
    hanzis = list(dict.fromkeys(hanzis))
    found = set()
    with connect() as conn:
        for start in range(0, len(hanzis), _IN_CHUNK):
            chunk = hanzis[start : start + _IN_CHUNK]
            rows = conn.execute(
                f"SELECT hanzi FROM words WHERE hanzi IN ({','.join('?' * len(chunk))})", chunk
            ).fetchall()
            found.update(r["hanzi"] for r in rows)
    return found


def insert(word):
    with connect() as conn:
        next_position = conn.execute(
            "SELECT COALESCE(MAX(position), -1) + 1 FROM words"
        ).fetchone()[0]
        conn.execute(
            """
            INSERT INTO words
                (id, hanzi, pinyin, meaning, example, example_pinyin, mnemonic_filename, mnemonic_credit, gif_filename,
                 audio_filename, position, category_id, ease_factor, interval_days, repetitions, due_at,
                 reviewed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                word["id"],
                word["hanzi"],
                word["pinyin"],
                word["meaning"],
                word.get("example", ""),
                word.get("example_pinyin", ""),
                word.get("mnemonic_filename"),
                word.get("mnemonic_credit"),
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


def count_media_references(filename):
    """So tu dang tham chieu file nay (anh goi nho, GIF hoac audio)."""
    with connect() as conn:
        return conn.execute(
            "SELECT COUNT(*) FROM words WHERE mnemonic_filename = ? OR gif_filename = ? OR audio_filename = ?",
            (filename, filename, filename),
        ).fetchone()[0]


def list_referenced_media():
    """Tap ten moi file dang duoc it nhat 1 tu tham chieu."""
    with connect() as conn:
        rows = conn.execute("SELECT mnemonic_filename, gif_filename, audio_filename FROM words").fetchall()
    return {name for row in rows for name in row if name}


def set_category(word_id, category_id):
    with connect() as conn:
        conn.execute("UPDATE words SET category_id = ? WHERE id = ?", (category_id, word_id))


def set_category_many(word_ids, category_id):
    """Gan danh muc cho nhieu tu trong MOT giao dich (cung thanh cong hoac cung huy). Tra so tu da doi."""
    updated = 0
    with connect() as conn:
        for start in range(0, len(word_ids), _IN_CHUNK):
            chunk = word_ids[start:start + _IN_CHUNK]
            marks = ", ".join("?" * len(chunk))
            cur = conn.execute(f"UPDATE words SET category_id = ? WHERE id IN ({marks})", [category_id, *chunk])
            updated += cur.rowcount
    return updated


def count_in_category(category_id):
    with connect() as conn:
        return conn.execute(
            "SELECT COUNT(*) FROM words WHERE category_id = ?", (category_id,)
        ).fetchone()[0]


def _scope_clause(category_ids, uncategorized_only):
    """Dieu kien SQL (bat dau bang ' AND ') va tham so cho pham vi danh muc; category_ids == [] -> khong co tu nao."""
    if uncategorized_only:
        return " AND category_id IS NULL", []
    if category_ids is None:
        return "", []
    if not category_ids:
        return " AND 0", []
    return f" AND category_id IN ({','.join('?' * len(category_ids))})", list(category_ids)


def list_due(now_iso, category_ids=None, uncategorized_only=False):
    """Tu co due_at <= now_iso va khong bi hoan hom nay. category_ids: chi lay cac danh muc nay (list khong rong);
    uncategorized_only: chi tu chua phan loai. Sap xep theo position."""
    today = now_iso[:10]
    scope_sql, scope_params = _scope_clause(category_ids, uncategorized_only)
    sql = "SELECT * FROM words WHERE due_at <= ? AND (buried_until = '' OR buried_until <= ?)" + scope_sql
    with connect() as conn:
        rows = conn.execute(sql + " ORDER BY position", [now_iso, today] + scope_params).fetchall()
        return [_row_to_word(r) for r in rows]


def bury(word_id, until):
    """Hoan tu den ngay `until` (YYYY-MM-DD); khong dung toi lich on tap."""
    with connect() as conn:
        conn.execute("UPDATE words SET buried_until = ? WHERE id = ?", (until, word_id))


def count_buried(today, category_ids=None, uncategorized_only=False):
    """So tu dang bi hoan (buried_until > today) trong pham vi."""
    scope_sql, scope_params = _scope_clause(category_ids, uncategorized_only)
    with connect() as conn:
        return conn.execute(
            "SELECT COUNT(*) FROM words WHERE buried_until > ?" + scope_sql, [today] + scope_params
        ).fetchone()[0]


def clear_buried(today, category_ids=None, uncategorized_only=False):
    """Bo hoan cac tu dang bi hoan trong pham vi; tra ve so tu da bo hoan."""
    scope_sql, scope_params = _scope_clause(category_ids, uncategorized_only)
    with connect() as conn:
        cur = conn.execute(
            "UPDATE words SET buried_until = '' WHERE buried_until > ?" + scope_sql, [today] + scope_params
        )
        return cur.rowcount


def count_due_grouped(now_iso):
    """Dem tu den han theo category_id: cot n (New), l (Learn), d (Due)."""
    with connect() as conn:
        return conn.execute(
            """
            SELECT category_id,
                SUM(CASE WHEN reviewed = 0 AND repetitions = 0 THEN 1 ELSE 0 END) AS n,
                SUM(CASE WHEN reviewed = 1 AND repetitions = 0 THEN 1 ELSE 0 END) AS l,
                SUM(CASE WHEN repetitions > 0 THEN 1 ELSE 0 END) AS d
            FROM words WHERE due_at <= ? AND (buried_until = '' OR buried_until <= ?)
            GROUP BY category_id
            """,
            (now_iso, now_iso[:10]),
        ).fetchall()
