"""
Luu anh upload (anh goi nho, gif net viet). Khong import flask: nhan doi tuong co
.filename va .save(path) (kieu werkzeug FileStorage) va dict-like cho form/files.
"""

import logging
import os
import uuid

from ankitool.config.settings import get_config
from ankitool.constants import messages
from ankitool.constants.media import ALLOWED_IMAGE_EXT, IMAGE_FIELDS
from ankitool.errors import AppError, ValidationError
from ankitool.integrations import tts
from ankitool.repositories import word_repository

logger = logging.getLogger(__name__)


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

    Tra ve danh sach ten file vua ghi xuong dia. Neu chinh ham nay nem loi (vd field
    thu hai sai duoi file) thi cac file da ghi o lan goi nay bi xoa roi nem lai loi.
    """
    saved = []
    try:
        for field_name in IMAGE_FIELDS:
            file = files.get(field_name)
            if file and file.filename:
                filename = save_uploaded_image(file)
                saved.append(filename)
                word[f"{field_name}_filename"] = filename
            elif remove_flags and remove_flags.get(field_name):
                word[f"{field_name}_filename"] = None
    except Exception:
        discard_files(saved)
        raise
    return saved


def _media_path(filename):
    """Duong dan day du cua file trong media_dir, hoac None neu ten khong an toan
    (rong, chua dau phan cach thu muc, '..', tuyet doi, ky tu NUL)."""
    if not filename or not isinstance(filename, str) or chr(0) in filename:
        return None
    separators = {"/", "\\", os.sep, os.altsep} - {None}
    if filename in (".", "..") or any(sep in filename for sep in separators):
        return None
    media_dir = os.path.abspath(get_config().media_dir)
    path = os.path.abspath(os.path.join(media_dir, filename))
    return path if os.path.dirname(path) == media_dir else None


def _remove_file(filename):
    """Xoa 1 file trong media_dir; moi loi (thieu file, bi khoa, khong co quyen) chi ghi log. True neu da xoa."""
    path = _media_path(filename)
    if path is None:
        logger.warning("Bo qua ten file media khong an toan: %r", filename)
        return False
    if not os.path.isfile(path):  # thieu file hoac la thu muc: khong co gi de xoa
        return False
    try:
        os.remove(path)
        return True
    except FileNotFoundError:
        return False
    except OSError as e:
        logger.warning("Khong xoa duoc file media %s: %s", filename, e)
        return False


def delete_unreferenced(filenames):
    """Xoa cac file khong con tu nao tham chieu (goi SAU khi thao tac DB da xong).
    Tra ve danh sach ten file da xoa. Khong bao gio nem loi."""
    deleted = []
    for name in dict.fromkeys(f for f in filenames if f):
        try:
            if word_repository.count_media_references(name) > 0:
                continue
        except Exception as e:  # khong kiem tra duoc thi giu file cho an toan
            logger.warning("Khong kiem tra duoc tham chieu cua %s: %s", name, e)
            continue
        if _remove_file(name):
            deleted.append(name)
    return deleted


def discard_files(filenames):
    """Xoa khong can kiem tra tham chieu - CHI dung cho file vua ghi trong cung yeu cau va chua tung vao DB."""
    for name in dict.fromkeys(f for f in filenames if f):
        _remove_file(name)


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
