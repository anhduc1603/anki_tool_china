"""
Cau hinh ung dung: duong dan, cau hinh Flask, host/port.

Thu muc du lieu mac dinh la <goc repo>/data; co the doi bang bien moi truong
ANKITOOL_DATA_DIR (vd de thu tren du lieu tam, khong dung vao du lieu that).
"""

import os
from dataclasses import dataclass

ENV_DATA_DIR = "ANKITOOL_DATA_DIR"

# config/ -> ankitool/ -> backend/ -> goc repo
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 5000
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB moi request


@dataclass(frozen=True)
class AppConfig:
    root_dir: str
    frontend_dir: str
    data_dir: str
    media_dir: str
    db_file: str
    legacy_words_file: str
    max_content_length: int = MAX_CONTENT_LENGTH
    host: str = DEFAULT_HOST
    port: int = DEFAULT_PORT
    debug: bool = True

    @classmethod
    def from_env(cls, **overrides):
        data_dir = os.path.abspath(os.environ.get(ENV_DATA_DIR) or os.path.join(ROOT_DIR, "data"))
        values = dict(
            root_dir=ROOT_DIR,
            frontend_dir=os.path.join(ROOT_DIR, "frontend"),
            data_dir=data_dir,
            media_dir=os.path.join(data_dir, "media"),
            db_file=os.path.join(data_dir, "ankitool.db"),
            legacy_words_file=os.path.join(data_dir, "words.json"),
        )
        values.update(overrides)
        return cls(**values)


_current = None


def get_config():
    """Cau hinh hien hanh (doc tu moi truong o lan goi dau neu chua duoc dat)."""
    global _current
    if _current is None:
        _current = AppConfig.from_env()
    return _current


def set_config(config):
    global _current
    _current = config
    return config
