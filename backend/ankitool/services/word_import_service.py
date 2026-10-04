"""
Nhap hang loat tu vung tu CSV (thuong do AI sinh): phan tich CSV chiu loi, xem truoc
(khong ghi gi), va nhap tung lo nho. Moi kiem tra do server lam; giao dien chi hien thi.
Khong import flask.
"""

import csv
import io
import unicodedata

from ankitool.constants import messages
from ankitool.constants.import_limits import (
    IMPORT_BATCH_MAX_ROWS,
    IMPORT_DELIMITERS,
    IMPORT_MAX_BYTES,
    IMPORT_MAX_ROWS,
    IMPORT_OPTIONAL_COLUMNS,
    IMPORT_REQUIRED_COLUMNS,
)
from ankitool.errors import AppError, ValidationError
from ankitool.repositories import word_repository
from ankitool.services import word_service

STATUS_OK = "ok"
STATUS_DUPLICATE = "duplicate"
STATUS_INVALID = "invalid"
STATUS_CREATED = "created"
STATUS_FAILED = "failed"

_FENCE = "```"
_KNOWN_COLUMNS = IMPORT_REQUIRED_COLUMNS + IMPORT_OPTIONAL_COLUMNS


def _normalize(value):
    """strip + Unicode NFC (pinyin co dau thanh viet dang to hop hien thi dong nhat)."""
    return unicodedata.normalize("NFC", value.strip())


def _strip_code_fence(text):
    """Bo BOM va khoi code Markdown (``` o dau/cuoi) ma AI hay boc quanh CSV."""
    text = text.lstrip("﻿")
    lines = text.splitlines()
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    if lines and lines[0].strip().startswith(_FENCE):
        lines.pop(0)
        while lines and not lines[-1].strip():
            lines.pop()
        if lines and lines[-1].strip().startswith(_FENCE):
            lines.pop()
    return "\n".join(lines)


def _detect_delimiter(text):
    """Chon dau phan cach xuat hien nhieu nhat tren dong tieu de (hoa -> dau phay)."""
    header_line = next((ln for ln in text.splitlines() if ln.strip()), "")
    best, best_count = IMPORT_DELIMITERS[0], 0
    for delim in IMPORT_DELIMITERS:
        count = header_line.count(delim)
        if count > best_count:
            best, best_count = delim, count
    return best


def parse_csv(text):
    """Phan tich CSV -> (cac dong, canh bao). Moi dong:
    {"row", "hanzi", "pinyin", "meaning", "example", "problem"}; row dem tu dong du lieu dau tien
    (khong tinh tieu de va dong trong); problem la ly do dong khong hop le (hoac None).
    Loi cau truc (rong, qua lon, thieu cot bat buoc, qua nhieu dong) -> ValidationError."""
    if len(text.encode("utf-8")) > IMPORT_MAX_BYTES:
        raise ValidationError(messages.IMPORT_TOO_LARGE.format(limit_kb=IMPORT_MAX_BYTES // 1024))
    text = _strip_code_fence(text)
    if not text.strip():
        raise ValidationError(messages.IMPORT_EMPTY)

    reader = csv.reader(io.StringIO(text), delimiter=_detect_delimiter(text), skipinitialspace=True)
    try:
        raw_rows = [r for r in reader if any(c.strip() for c in r)]
    except csv.Error as e:
        raise ValidationError(messages.IMPORT_MALFORMED.format(error=e))

    header_cells = raw_rows[0]
    index_of = {}
    for i, cell in enumerate(header_cells):
        name = cell.strip().lower()
        if name in _KNOWN_COLUMNS and name not in index_of:
            index_of[name] = i
    missing = [c for c in IMPORT_REQUIRED_COLUMNS if c not in index_of]
    if missing:
        raise ValidationError(messages.IMPORT_MISSING_COLUMNS.format(columns=", ".join(missing)))

    known_indexes = set(index_of.values())
    ignored = [c.strip() for i, c in enumerate(header_cells) if i not in known_indexes and c.strip()]
    warnings = [messages.IMPORT_IGNORED_COLUMNS.format(columns=", ".join(ignored))] if ignored else []

    data_rows = raw_rows[1:]
    if len(data_rows) > IMPORT_MAX_ROWS:
        raise ValidationError(
            messages.IMPORT_TOO_MANY_ROWS.format(count=len(data_rows), limit=IMPORT_MAX_ROWS)
        )

    rows = []
    for number, cells in enumerate(data_rows, start=1):
        def cell(name):
            i = index_of.get(name)
            return _normalize(cells[i]) if i is not None and i < len(cells) else ""

        extra_values = [c for c in cells[len(header_cells):] if c.strip()]
        rows.append(
            {
                "row": number,
                "hanzi": cell("hanzi"),
                "pinyin": cell("pinyin"),
                "meaning": cell("meaning"),
                "example": cell("example"),
                "problem": messages.IMPORT_ROW_TOO_MANY_VALUES if extra_values else None,
            }
        )
    return rows, warnings


def _has_required_fields(row):
    return bool(row["hanzi"] and row["pinyin"] and row["meaning"])


def preview(csv_text):
    """Xem truoc: danh dau tung dong ok/duplicate/invalid, khong ghi gi vao DB."""
    if not isinstance(csv_text, str):
        raise ValidationError(messages.IMPORT_NOT_TEXT)
    parsed, warnings = parse_csv(csv_text)
    existing = word_repository.find_existing_hanzi([r["hanzi"] for r in parsed if r["hanzi"]])

    first_row_of = {}
    rows = []
    summary = {"total": len(parsed), STATUS_OK: 0, STATUS_DUPLICATE: 0, STATUS_INVALID: 0}
    for r in parsed:
        status, reason = STATUS_OK, None
        if r["problem"]:
            status, reason = STATUS_INVALID, r["problem"]
        elif not _has_required_fields(r):
            status, reason = STATUS_INVALID, messages.IMPORT_ROW_MISSING_FIELDS
        elif r["hanzi"] in existing:
            status, reason = STATUS_DUPLICATE, messages.IMPORT_ROW_DUPLICATE_EXISTING
        elif r["hanzi"] in first_row_of:
            status = STATUS_DUPLICATE
            reason = messages.IMPORT_ROW_DUPLICATE_IN_FILE.format(first_row=first_row_of[r["hanzi"]])
        else:
            first_row_of[r["hanzi"]] = r["row"]
        item = {k: r[k] for k in ("row", "hanzi", "pinyin", "meaning", "example")}
        item["status"] = status
        if reason:
            item["reason"] = reason
        rows.append(item)
        summary[status] += 1
    return {"rows": rows, "summary": summary, "warnings": warnings}


def _read_batch(rows):
    """Kiem tra hinh dang 1 lo cac dong can nhap, tra ve danh sach dong da lam sach."""
    if not isinstance(rows, list) or not rows:
        raise ValidationError(messages.IMPORT_BATCH_INVALID)
    if len(rows) > IMPORT_BATCH_MAX_ROWS:
        raise ValidationError(messages.IMPORT_BATCH_TOO_LARGE.format(limit=IMPORT_BATCH_MAX_ROWS))
    batch = []
    for item in rows:
        number = item.get("row") if isinstance(item, dict) else None
        if isinstance(number, bool) or not isinstance(number, int):
            raise ValidationError(messages.IMPORT_BATCH_INVALID)
        batch.append(
            {
                "row": number,
                **{
                    key: _normalize(item[key]) if isinstance(item.get(key), str) else ""
                    for key in ("hanzi", "pinyin", "meaning", "example")
                },
            }
        )
    return batch


def import_rows(rows):
    """Nhap 1 lo dong (toi da IMPORT_BATCH_MAX_ROWS), tuan tu theo thu tu nhan duoc.

    Server kiem tra lai thieu truong va trung (voi DB va voi cac dong da nhap trong lo),
    khong tin ket qua xem truoc. Loi tung dong khong dung ca lo."""
    batch = _read_batch(rows)
    existing = word_repository.find_existing_hanzi([r["hanzi"] for r in batch if r["hanzi"]])
    created_row_of = {}
    results = []
    summary = {STATUS_CREATED: 0, STATUS_DUPLICATE: 0, STATUS_INVALID: 0, STATUS_FAILED: 0}
    for r in batch:
        result = {"row": r["row"]}
        if not _has_required_fields(r):
            result.update(status=STATUS_INVALID, reason=messages.IMPORT_ROW_MISSING_FIELDS)
        elif r["hanzi"] in existing:
            result.update(status=STATUS_DUPLICATE, reason=messages.IMPORT_ROW_DUPLICATE_EXISTING)
        elif r["hanzi"] in created_row_of:
            result.update(
                status=STATUS_DUPLICATE,
                reason=messages.IMPORT_ROW_DUPLICATE_IN_FILE.format(first_row=created_row_of[r["hanzi"]]),
            )
        else:
            try:
                word = word_service.create_word(r["hanzi"], r["pinyin"], r["meaning"], r["example"])
            except AppError as e:
                result.update(status=STATUS_FAILED, reason=messages.IMPORT_ROW_FAILED.format(error=e.message))
            except Exception:
                result.update(status=STATUS_FAILED, reason=messages.IMPORT_ROW_FAILED_UNKNOWN)
            else:
                created_row_of[r["hanzi"]] = r["row"]
                result.update(status=STATUS_CREATED, id=word["id"])
        summary[result["status"]] += 1
        results.append(result)
    return {"results": results, "summary": summary}
