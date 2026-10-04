"""
Luat nghiep vu tu vung: kiem tra truong bat buoc, anh upload, sinh audio, them/sua/xoa.
Nhan `form`/`files` dang dict-like (vd request.form/request.files) nhung khong import flask.
"""

import os
import uuid

from ankitool.constants import messages
from ankitool.constants.media import IMAGE_FIELDS
from ankitool.errors import NotFoundError, ValidationError
from ankitool.repositories import word_repository
from ankitool.services import media_service


def list_words():
    return word_repository.list_all()


def _read_text_fields(form):
    hanzi = (form.get("hanzi") or "").strip()
    pinyin = (form.get("pinyin") or "").strip()
    meaning = (form.get("meaning") or "").strip()
    example = (form.get("example") or "").strip()
    if not hanzi or not pinyin or not meaning:
        raise ValidationError(messages.MISSING_WORD_FIELDS)
    return hanzi, pinyin, meaning, example


def add_word(form, files):
    hanzi, pinyin, meaning, example = _read_text_fields(form)

    word = {
        "id": uuid.uuid4().hex,
        "hanzi": hanzi,
        "pinyin": pinyin,
        "meaning": meaning,
        "example": example,
        "mnemonic_filename": None,
        "gif_filename": None,
        "audio_filename": None,
    }

    media_service.apply_image_uploads(word, files)
    word["audio_filename"] = os.path.basename(media_service.generate_audio_file(hanzi))

    word_repository.insert(word)
    return word_repository.get(word["id"])


def update_word(word_id, form, files):
    word = word_repository.get(word_id)
    if not word:
        raise NotFoundError(messages.WORD_NOT_FOUND)

    hanzi, pinyin, meaning, example = _read_text_fields(form)

    remove_flags = {name: form.get(f"remove_{name}") == "1" for name in IMAGE_FIELDS}
    media_service.apply_image_uploads(word, files, remove_flags)
    audio_filename = os.path.basename(media_service.generate_audio_file(hanzi))

    word_repository.update(
        word_id,
        {
            "hanzi": hanzi,
            "pinyin": pinyin,
            "meaning": meaning,
            "example": example,
            "mnemonic_filename": word.get("mnemonic_filename"),
            "gif_filename": word.get("gif_filename"),
            "audio_filename": audio_filename,
        },
    )
    return word_repository.get(word_id)


def delete_word(word_id):
    if not word_repository.delete(word_id):
        raise NotFoundError(messages.WORD_NOT_FOUND)
