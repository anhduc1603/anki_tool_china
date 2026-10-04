"""
Ket noi SQLite. Moi lan goi mo 1 ket noi rieng (giong cach cu) - don gian, khong can lo
thread-safety cho 1 dev server chay tuan tu.
"""

import os
import sqlite3

from ankitool.config.settings import get_config


def connect():
    config = get_config()
    os.makedirs(config.data_dir, exist_ok=True)
    conn = sqlite3.connect(config.db_file)
    conn.row_factory = sqlite3.Row
    return conn
