"""Xuat toan bo tu vung ra file .apkg de import vao Anki."""

import os
import tempfile

from ankitool.config.settings import get_config
from ankitool.constants import messages
from ankitool.constants.media import DEFAULT_DECK_NAME
from ankitool.errors import AppError, ValidationError
from ankitool.integrations.anki import deck_builder
from ankitool.repositories import word_repository


def build_export(deck_name=None):
    """Dung file .apkg tam, tra ve (duong_dan_file, ten_file_tai_ve)."""
    deck_name = (deck_name or DEFAULT_DECK_NAME).strip() or DEFAULT_DECK_NAME
    words = word_repository.list_all()
    if not words:
        raise ValidationError(messages.EMPTY_WORD_LIST)

    media_dir = get_config().media_dir
    build_words = []
    for w in words:
        mnemonic_path = None
        if w.get("mnemonic_filename"):
            mnemonic_path = os.path.join(media_dir, w["mnemonic_filename"])
        gif_path = None
        if w.get("gif_filename"):
            gif_path = os.path.join(media_dir, w["gif_filename"])
        build_words.append(
            {
                "hanzi": w["hanzi"],
                "pinyin": w["pinyin"],
                "meaning": w["meaning"],
                "example": w.get("example", ""),
                "mnemonic_path": mnemonic_path,
                "gif_path": gif_path,
            }
        )

    tmp = tempfile.NamedTemporaryFile(suffix=".apkg", delete=False)
    tmp.close()
    try:
        deck_builder.build_apkg(build_words, media_dir, tmp.name, deck_name)
    except Exception as e:
        raise AppError(messages.EXPORT_ERROR.format(error=e), 500)
    return tmp.name, f"{deck_name}.apkg"
