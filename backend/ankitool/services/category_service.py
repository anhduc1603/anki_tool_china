"""
Luat nghiep vu danh muc: toi da 2 cap (cha/con), chan xoa khi con phu thuoc,
chi gan tu vao danh muc con.
"""

from ankitool.constants import messages
from ankitool.constants.scopes import UNCATEGORIZED
from ankitool.errors import NotFoundError, ValidationError
from ankitool.repositories import category_repository, word_repository


def list_categories():
    return category_repository.list_all()


def create_category(name, parent_id=None):
    name = (name or "").strip()
    parent_id = parent_id or None
    if not name:
        raise ValidationError(messages.MISSING_CATEGORY_NAME)
    if parent_id:
        parent = category_repository.get(parent_id)
        if parent is None:
            raise ValidationError(messages.PARENT_CATEGORY_NOT_FOUND)
        if parent["parent_id"] is not None:
            raise ValidationError(messages.CATEGORY_CHILD_OF_CHILD)
    return category_repository.insert(name, parent_id)


def rename_category(category_id, name):
    name = (name or "").strip()
    if not name:
        raise ValidationError(messages.MISSING_CATEGORY_NAME)
    if not category_repository.rename(category_id, name):
        raise NotFoundError(messages.CATEGORY_NOT_FOUND)


def delete_category(category_id):
    category = category_repository.get(category_id)
    if category is None:
        raise NotFoundError(messages.CATEGORY_NOT_FOUND)

    if category["parent_id"] is None:
        if category_repository.count_children(category_id) > 0:
            raise ValidationError(messages.CATEGORY_HAS_CHILDREN)
    elif word_repository.count_in_category(category_id) > 0:
        raise ValidationError(messages.CATEGORY_HAS_WORDS)

    category_repository.delete(category_id)


def require_child_category(category_id):
    """Danh muc phai ton tai va la danh muc con (tu chi duoc gan vao danh muc con)."""
    category = category_repository.get(category_id)
    if category is None:
        raise ValidationError(messages.CATEGORY_NOT_FOUND)
    if category["parent_id"] is None:
        raise ValidationError(messages.ASSIGN_TO_PARENT_CATEGORY)


def assign_word(word_id, category_id):
    """category_id None = bo gan. Chi duoc gan vao danh muc con."""
    if not word_repository.exists(word_id):
        raise NotFoundError(messages.WORD_NOT_FOUND)

    if category_id is not None:
        require_child_category(category_id)

    word_repository.set_category(word_id, category_id)


BULK_ASSIGN_MAX = 1000


def assign_words(word_ids, category_id):
    """Gan nhieu tu vao 1 danh muc con (category_id rong/None = bo gan) trong mot lan: cung doi hoac khong tu nao doi.
    Id khong khop tu nao bi bo qua va duoc dem. Tra {"updated": n, "missing": m}."""
    if not isinstance(word_ids, list) or not word_ids or not all(isinstance(i, str) and i.strip() for i in word_ids):
        raise ValidationError(messages.BULK_ASSIGN_INVALID_LIST)
    ids = list(dict.fromkeys(i.strip() for i in word_ids))  # bo trung, giu thu tu
    if len(ids) > BULK_ASSIGN_MAX:
        raise ValidationError(messages.BULK_ASSIGN_TOO_MANY.format(limit=BULK_ASSIGN_MAX))
    target = clean_category_id(category_id)  # sai danh muc -> loi, chua ghi gi
    updated = word_repository.set_category_many(ids, target)
    return {"updated": updated, "missing": len(ids) - updated}


def clean_category_id(value):
    """Gia tri category_id do nguoi dung gui (form/JSON): rong -> None (chua phan loai);
    co gia tri -> phai la danh muc con hop le, neu khong -> ValidationError."""
    if value is None or (isinstance(value, str) and not value.strip()):
        return None
    if not isinstance(value, str):
        raise ValidationError(messages.CATEGORY_NOT_FOUND)
    value = value.strip()
    require_child_category(value)
    return value


def resolve_scope(scope):
    """Doi pham vi (None/"" = tat ca; "uncategorized"; id danh muc cha = cac danh muc con;
    id danh muc con) thanh (category_ids, uncategorized_only).
    (None, False) = khong loc; category_ids == [] = pham vi khong co danh muc nao (khong co tu)."""
    if scope == UNCATEGORIZED:
        return None, True
    if not scope:
        return None, False
    category = category_repository.get(scope)
    if category is None:
        return [], False
    if category["parent_id"] is None:
        return category_repository.list_child_ids(scope), False
    return [scope], False
