"""
Luu anh upload (anh goi nho, gif net viet). Khong import flask: nhan doi tuong co
.filename va .save(path) (kieu werkzeug FileStorage) va dict-like cho form/files.
"""

import os
import uuid

from ankitool.config.settings import get_config
from ankitool.constants import messages
from ankitool.constants.media import ALLOWED_IMAGE_EXT, IMAGE_FIELDS
from ankitool.errors import AppError, ValidationError
from ankitool.integrations import tts


def save_uploaded_image(file_storage):
    """Luu file, tra ve ten file moi (uuid + duoi goc). Duoi khong ho tro -> ValidationError."""
    ext = os.path.splitext(file_storage.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXT:
        raise ValidationError(
            messages.UNSUPPORTED_IMAGE_FORMAT.format(ext=ext or messages.UNKNOWN_IMAGE_EXTENSION)
        )
    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(get_config().media_dir, filename)
    file_storage.save(path)
    return filename


def apply_image_uploads(word, files, remove_flags=None):
    """Cap nhat word[f'{field}_filename'] theo file upload cua tung field anh.

    files: dict-like {ten_field: file}. remove_flags: {ten_field: True} neu client
    yeu cau xoa anh (chi dung khi sua tu). File moi uu tien hon co xoa.
    """
    for field_name in IMAGE_FIELDS:
        file = files.get(field_name)
        if file and file.filename:
            word[f"{field_name}_filename"] = save_uploaded_image(file)
        elif remove_flags and remove_flags.get(field_name):
            word[f"{field_name}_filename"] = None


def generate_audio_file(text):
    """Sinh (hoac lay tu cache) audio cho text, tra ve duong dan file. Loi -> AppError 500."""
    try:
        return tts.ensure_audio(text, get_config().media_dir)
    except Exception as e:
        raise AppError(messages.AUDIO_ERROR.format(error=e), 500)


def synthesize_speech(text):
    """Cho /api/tts: sinh audio cho text bat ky, tra ve ten file audio."""
    text = (text or "").strip()
    if not text:
        raise ValidationError(messages.MISSING_TTS_TEXT)
    return os.path.basename(generate_audio_file(text))
