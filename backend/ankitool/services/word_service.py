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
from ankitool.services import category_service, media_service
from ankitool.utils import pinyin as pinyin_utils


def list_words(scope=None):
    """Tu theo pham vi danh muc (None/"" = tat ca, xem category_service.resolve_scope)."""
    category_ids, uncategorized_only = category_service.resolve_scope(scope)
    return word_repository.list_in_scope(category_ids, uncategorized_only)


def normalize_example_pinyin(example, example_pinyin):
    """Chuan hoa pinyin cau vi du (am tiet cach nhau 1 dau cach) va kiem tra khop so chu Han cua cau vi du.
    Tra ve (pinyin_da_chuan_hoa, None) hoac ("", thong_bao_loi). Rong -> ("", None)."""
    try:
        syllables = pinyin_utils.split_syllables(example_pinyin)
    except pinyin_utils.PinyinInvalid as e:
        return "", messages.EXAMPLE_PINYIN_INVALID.format(token=e.token)
    if not syllables:
        return "", None
    chars = len(pinyin_utils.annotatable_indexes(example))
    if chars != len(syllables):
        return "", messages.EXAMPLE_PINYIN_MISMATCH.format(chars=chars, syllables=len(syllables))
    return " ".join(syllables), None


def _clean_example_pinyin(example, example_pinyin):
    cleaned, problem = normalize_example_pinyin(example, example_pinyin)
    if problem:
        raise ValidationError(problem)
    return cleaned


def _read_text_fields(form):
    hanzi = (form.get("hanzi") or "").strip()
    pinyin = (form.get("pinyin") or "").strip()
    meaning = (form.get("meaning") or "").strip()
    example = (form.get("example") or "").strip()
    if not hanzi or not pinyin or not meaning:
        raise ValidationError(messages.MISSING_WORD_FIELDS)
    return hanzi, pinyin, meaning, example


def _new_word_dict(hanzi, pinyin, meaning, example, category_id=None, example_pinyin=""):
    return {
        "id": uuid.uuid4().hex,
        "hanzi": hanzi,
        "pinyin": pinyin,
        "meaning": meaning,
        "example": example,
        "example_pinyin": example_pinyin,
        "mnemonic_filename": None,
        "gif_filename": None,
        "audio_filename": None,
        "category_id": category_id,
    }


def _save_new_word(word):
    """Sinh audio cho tu moi, luu vao DB va tra ve tu vua luu."""
    word["audio_filename"] = os.path.basename(media_service.generate_audio_file(word["hanzi"]))
    word_repository.insert(word)
    return word_repository.get(word["id"])


def _media_files_of(word):
    """Ten cac file dinh kem (anh goi nho, GIF, audio) ma tu dang tham chieu."""
    return [word.get("mnemonic_filename"), word.get("gif_filename"), word.get("audio_filename")]


def add_word(form, files):
    hanzi, pinyin, meaning, example = _read_text_fields(form)
    category_id = category_service.clean_category_id(form.get("category_id"))  # sai -> loi, chua ghi gi
    example_pinyin = _clean_example_pinyin(example, form.get("example_pinyin"))
    word = _new_word_dict(hanzi, pinyin, meaning, example, category_id, example_pinyin)
    saved = media_service.apply_image_uploads(word, files)
    try:
        return _save_new_word(word)
    except Exception:
        media_service.discard_files(saved)  # luu loi: khong de lai anh vua tai len
        raise


def create_word(hanzi, pinyin, meaning, example="", category_id=None, example_pinyin=""):
    """Tao tu moi khong kem anh (dung cho nhap hang loat); cac gia tri da duoc lam sach
    (category_id va example_pinyin da duoc kiem tra boi nguoi goi)."""
    return _save_new_word(_new_word_dict(hanzi, pinyin, meaning, example, category_id, example_pinyin))


def update_word(word_id, form, files):
    word = word_repository.get(word_id)
    if not word:
        raise NotFoundError(messages.WORD_NOT_FOUND)

    hanzi, pinyin, meaning, example = _read_text_fields(form)
    fields = {"hanzi": hanzi, "pinyin": pinyin, "meaning": meaning, "example": example}
    if "example_pinyin" in form:  # chi ghi khi nguoi goi gui truong nay (goi API cu khong lam mat pinyin)
        fields["example_pinyin"] = _clean_example_pinyin(example, form.get("example_pinyin"))
    if "category_id" in form:  # chi doi danh muc khi nguoi goi gui truong nay
        fields["category_id"] = category_service.clean_category_id(form.get("category_id"))

    old_files = _media_files_of(word)  # truoc khi apply_image_uploads doi ten file trong dict
    remove_flags = {name: form.get(f"remove_{name}") == "1" for name in IMAGE_FIELDS}
    saved = media_service.apply_image_uploads(word, files, remove_flags)
    try:
        audio_filename = os.path.basename(media_service.generate_audio_file(hanzi))
        word_repository.update(
            word_id,
            {
                **fields,
                "mnemonic_filename": word.get("mnemonic_filename"),
                "gif_filename": word.get("gif_filename"),
                "audio_filename": audio_filename,
            },
        )
    except Exception:
        media_service.discard_files(saved)  # luu loi: bo anh vua tai len, tu va file cu giu nguyen
        raise
    updated = word_repository.get(word_id)
    media_service.delete_unreferenced(old_files)  # sau khi ghi DB: don file cu khong con dung
    return updated


def delete_word(word_id):
    word = word_repository.get(word_id)
    if word is None or not word_repository.delete(word_id):
        raise NotFoundError(messages.WORD_NOT_FOUND)
    media_service.delete_unreferenced(_media_files_of(word))  # sau khi xoa dong: don file khong con ai dung
