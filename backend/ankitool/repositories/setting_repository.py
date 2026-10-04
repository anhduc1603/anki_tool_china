"""Truy van SQL cho bang settings (key -> chuoi JSON). Kiem tra gia tri nam o settings_service."""

from ankitool.database.connection import connect


def get_all():
    """Tra ve {key: chuoi_json_tho}."""
    with connect() as conn:
        rows = conn.execute("SELECT key, value FROM settings").fetchall()
    return {row["key"]: row["value"] for row in rows}


def upsert_many(values):
    """values: {key: chuoi_json}. Ghi tat ca trong 1 giao dich."""
    with connect() as conn:
        for key, value in values.items():
            conn.execute(
                "INSERT INTO settings (key, value) VALUES (?, ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (key, value),
            )
