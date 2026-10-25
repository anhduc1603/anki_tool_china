"""Goi y anh minh hoa cho tu: tim tren kho anh mien phi, cap token cho tung anh, tai anh theo token.

Trinh duyet chi biet `token` (khong bao gio la dia chi anh ngoai): server chi tai nhung anh chinh no da liet ke
trong mot lan tim gan day, nen khong the bi bao tai dia chi tuy y (SSRF). Bo nho nam trong tien trinh
(gunicorn chay 1 worker nhieu luong); het han thi nguoi dung chi phai tim lai.
"""

import threading
import time
import uuid
from collections import OrderedDict

from ankitool.constants import image_search as cfg
from ankitool.constants import messages
from ankitool.errors import AppError, NotFoundError, ValidationError
from ankitool.integrations import image_search

_lock = threading.Lock()
_candidates = OrderedDict()  # token -> {"url", "expires"}
_search_cache = OrderedDict()  # (source, tu khoa chuan hoa) -> {"expires", "response"}
_image_cache = OrderedDict()  # token -> (bytes, mime)


def _now():
    return time.time()


def _normalize(keyword):
    return " ".join((keyword or "").split())


def _trim(store, limit):
    while len(store) > limit:
        store.popitem(last=False)


def _purge_expired():
    now = _now()
    for token in [t for t, c in _candidates.items() if c["expires"] <= now]:
        del _candidates[token]
        _image_cache.pop(token, None)


def _credit_text(item):
    author = item.get("author") or "Không rõ tác giả"
    return f"{author} · {item.get('license') or 'không rõ giấy phép'}"


def _register(item):
    """Cap token cho 1 ung vien; tra ban cong khai (khong co URL anh ngoai)."""
    token = uuid.uuid4().hex
    _candidates[token] = {"url": item["url"], "expires": _now() + cfg.CANDIDATE_TTL_SECONDS}
    _trim(_candidates, cfg.CANDIDATE_MAX)
    return {
        "token": token,
        "title": item.get("title") or "",
        "credit_text": _credit_text(item),
        "credit": {"author": item.get("author") or "", "license": item.get("license") or "", "source_url": item.get("source_url") or ""},
    }


def search(keyword, source):
    """Tim anh o 1 nguon. Tra {"source", "status": ok|error|limited, "results": [...]}.
    Loi nguon ngoai KHONG ra ngoai (tra status), de giao dien quyet dinh thong bao."""
    keyword = _normalize(keyword)
    if not keyword:
        raise ValidationError(messages.IMAGE_KEYWORD_REQUIRED)
    if len(keyword) > cfg.KEYWORD_MAX_LENGTH:
        raise ValidationError(messages.IMAGE_KEYWORD_TOO_LONG.format(limit=cfg.KEYWORD_MAX_LENGTH))
    if source not in image_search.SEARCHERS:
        raise ValidationError(messages.IMAGE_SOURCE_UNKNOWN)

    cache_key = (source, keyword.lower())
    with _lock:
        _purge_expired()
        cached = _search_cache.get(cache_key)
        if cached and cached["expires"] > _now() and all(r["token"] in _candidates for r in cached["response"]["results"]):
            return cached["response"]

    try:
        items = image_search.SEARCHERS[source](keyword)
        status = cfg.STATUS_OK
    except image_search.ImageSearchError as e:
        items = []
        status = cfg.STATUS_LIMITED if e.kind == "limited" else cfg.STATUS_ERROR

    seen = set()
    unique = []
    for item in items:
        key = ((item.get("title") or "").lower(), (item.get("author") or "").lower())
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    with _lock:
        results = [_register(item) for item in unique[: cfg.MAX_RESULTS]]
        response = {"source": source, "status": status, "results": results}
        if status == cfg.STATUS_OK:  # khong nho ket qua loi, de bam "thu lai" tim that
            _search_cache[cache_key] = {"expires": _now() + cfg.SEARCH_CACHE_TTL_SECONDS, "response": response}
            _trim(_search_cache, cfg.SEARCH_CACHE_MAX)
    return response


def get_image(token):
    """Tai anh cua 1 ung vien theo token. Tra (bytes, mime)."""
    with _lock:
        _purge_expired()
        candidate = _candidates.get(token)
        if candidate is None:
            raise NotFoundError(messages.IMAGE_CANDIDATE_EXPIRED)
        cached = _image_cache.get(token)
        if cached:
            _image_cache.move_to_end(token)
            return cached
        url = candidate["url"]
    try:
        data, mime = image_search.fetch_image(url)
    except image_search.ImageSearchError as e:
        if e.kind == "invalid":
            too_large = "too large" in str(e)
            message = (
                messages.IMAGE_TOO_LARGE.format(limit_mb=cfg.MAX_IMAGE_BYTES // (1024 * 1024))
                if too_large
                else messages.IMAGE_TYPE_NOT_ALLOWED
            )
            raise ValidationError(message) from e
        raise AppError(messages.IMAGE_FETCH_FAILED, 502) from e
    with _lock:
        _image_cache[token] = (data, mime)
        _trim(_image_cache, cfg.IMAGE_CACHE_MAX)
    return data, mime
