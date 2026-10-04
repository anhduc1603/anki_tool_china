"""
Tao bang, nang cap cot cho database cu va nhap data/words.json cu (neu DB trong).
Goi init_database() mot lan khi khoi dong app (khong chay khi import).
"""

import json
import os

from ankitool.config.settings import get_config
from ankitool.constants.srs import DEFAULT_EASE_FACTOR
from ankitool.database.connection import connect
from ankitool.utils.clock import today_iso


def init_database():
    _create_tables()
    _migrate_from_json_if_needed()


def _create_tables():
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS words (
                id TEXT PRIMARY KEY,
                hanzi TEXT NOT NULL,
                pinyin TEXT NOT NULL,
                meaning TEXT NOT NULL,
                example TEXT NOT NULL DEFAULT '',
                mnemonic_filename TEXT,
                gif_filename TEXT,
                audio_filename TEXT,
                position INTEGER NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parent_id TEXT REFERENCES categories(id),
                position INTEGER NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
            """
        )
        _upgrade_words_schema(conn)


def _upgrade_words_schema(conn):
    """Them cot moi cho lich on tap/category neu database cu chua co (vd:
    data/ankitool.db duoc tao tu truoc khi tinh nang nay ton tai)."""
    existing_cols = {row["name"] for row in conn.execute("PRAGMA table_info(words)")}

    if "category_id" not in existing_cols:
        conn.execute("ALTER TABLE words ADD COLUMN category_id TEXT REFERENCES categories(id)")
    if "ease_factor" not in existing_cols:
        conn.execute(f"ALTER TABLE words ADD COLUMN ease_factor REAL NOT NULL DEFAULT {DEFAULT_EASE_FACTOR}")
    if "interval_days" not in existing_cols:
        conn.execute("ALTER TABLE words ADD COLUMN interval_days INTEGER NOT NULL DEFAULT 0")
    if "repetitions" not in existing_cols:
        conn.execute("ALTER TABLE words ADD COLUMN repetitions INTEGER NOT NULL DEFAULT 0")
    if "due_at" not in existing_cols:
        conn.execute("ALTER TABLE words ADD COLUMN due_at TEXT NOT NULL DEFAULT ''")
        # Backfill: cac tu da co tu truoc tinh nang nay phai duoc coi la den han
        # ngay, vi chung chua tung duoc on tap.
        conn.execute("UPDATE words SET due_at = ? WHERE due_at = ''", (today_iso(),))
    if "reviewed" not in existing_cols:
        conn.execute("ALTER TABLE words ADD COLUMN reviewed INTEGER NOT NULL DEFAULT 0")
        # Backfill giong cach phan loai cu: tu da co repetitions/interval thi da tung duoc on.
        conn.execute("UPDATE words SET reviewed = 1 WHERE repetitions > 0 OR interval_days > 0")


def _migrate_from_json_if_needed():
    legacy_file = get_config().legacy_words_file
    with connect() as conn:
        count = conn.execute("SELECT COUNT(*) FROM words").fetchone()[0]
        if count > 0:
            return
        if not os.path.exists(legacy_file):
            return
        with open(legacy_file, encoding="utf-8") as f:
            legacy_words = json.load(f)
        today = today_iso()
        for position, w in enumerate(legacy_words):
            conn.execute(
                """
                INSERT INTO words
                    (id, hanzi, pinyin, meaning, example, mnemonic_filename, gif_filename, audio_filename,
                     position, category_id, ease_factor, interval_days, repetitions, due_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    w["id"],
                    w["hanzi"],
                    w["pinyin"],
                    w["meaning"],
                    w.get("example", ""),
                    w.get("mnemonic_filename"),
                    w.get("gif_filename"),
                    w.get("audio_filename"),
                    position,
                    None,
                    DEFAULT_EASE_FACTOR,
                    0,
                    0,
                    today,
                ),
            )
