"""Truy van SQL cho bang categories. Luat 2 cap, chan xoa... nam o category_service."""

import uuid

from ankitool.database.connection import connect


def _row_to_category(row):
    return {"id": row["id"], "name": row["name"], "parent_id": row["parent_id"]}


def list_all():
    with connect() as conn:
        rows = conn.execute("SELECT * FROM categories ORDER BY position").fetchall()
        return [_row_to_category(r) for r in rows]


def get(category_id):
    with connect() as conn:
        row = conn.execute("SELECT * FROM categories WHERE id = ?", (category_id,)).fetchone()
        return _row_to_category(row) if row else None


def insert(name, parent_id=None):
    """Them danh muc o cuoi danh sach, tra ve dict danh muc moi."""
    with connect() as conn:
        next_position = conn.execute(
            "SELECT COALESCE(MAX(position), -1) + 1 FROM categories"
        ).fetchone()[0]
        new_id = uuid.uuid4().hex
        conn.execute(
            "INSERT INTO categories (id, name, parent_id, position) VALUES (?, ?, ?, ?)",
            (new_id, name, parent_id, next_position),
        )
        return {"id": new_id, "name": name, "parent_id": parent_id}


def rename(category_id, name):
    with connect() as conn:
        cur = conn.execute("UPDATE categories SET name = ? WHERE id = ?", (name, category_id))
        return cur.rowcount > 0


def delete(category_id):
    with connect() as conn:
        conn.execute("DELETE FROM categories WHERE id = ?", (category_id,))


def count_children(parent_id):
    with connect() as conn:
        return conn.execute(
            "SELECT COUNT(*) FROM categories WHERE parent_id = ?", (parent_id,)
        ).fetchone()[0]


def list_child_ids(parent_id):
    with connect() as conn:
        return [
            r["id"]
            for r in conn.execute("SELECT id FROM categories WHERE parent_id = ?", (parent_id,))
        ]


def list_id_parent_pairs():
    """Tat ca (id, parent_id), dung de cong don so dem len danh muc cha."""
    with connect() as conn:
        return [(r["id"], r["parent_id"]) for r in conn.execute("SELECT id, parent_id FROM categories")]
