"""Tim va tai anh minh hoa tu kho anh mien phi (Wikimedia Commons, Openverse) bang urllib.

Chi lam viec voi mang: khong biet gi ve token hay luat nghiep vu (xem services/image_suggestion_service.py).
Ham mang goc la `http_get`; kiem thu thay the no de khong phu thuoc mang that.
"""

import html
import json
import os
import re
import threading
import urllib.error
import urllib.parse
import urllib.request

from ankitool.constants import image_search as cfg


class ImageSearchError(Exception):
    """kind: "network" (loi mang/nguon), "limited" (het luot), "invalid" (anh khong dung loai/qua lon/host la)."""

    def __init__(self, kind, message=""):
        super().__init__(message or kind)
        self.kind = kind


def is_allowed_url(url):
    """Chi https, co host thuoc danh sach cho phep, khong co thong tin dang nhap, cong mac dinh."""
    try:
        parts = urllib.parse.urlsplit(url)
        host = (parts.hostname or "").lower()
        port = parts.port
    except ValueError:
        return False
    if parts.scheme != "https" or not host or parts.username or parts.password or port not in (None, 443):
        return False
    return any(host == s or host.endswith("." + s) for s in cfg.ALLOWED_HOST_SUFFIXES)


class _CheckedRedirects(urllib.request.HTTPRedirectHandler):
    """Moi lan chuyen huong deu phai qua is_allowed_url (chan chuyen huong ra host la)."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not is_allowed_url(newurl):
            raise ImageSearchError("invalid", "redirect host not allowed")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


_opener = urllib.request.build_opener(_CheckedRedirects())


def http_get(url, timeout, headers=None, data=None, max_bytes=None):
    """Tra (status, response_headers_lowercase, body). Loi mang/timeout -> ImageSearchError("network").
    Vuot max_bytes -> ImageSearchError("invalid")."""
    if not is_allowed_url(url):
        raise ImageSearchError("invalid", "url not allowed")
    all_headers = {"User-Agent": cfg.USER_AGENT}
    all_headers.update(headers or {})
    request = urllib.request.Request(url, data=data, headers=all_headers)
    try:
        with _opener.open(request, timeout=timeout) as response:
            declared = response.headers.get("Content-Length")
            if max_bytes is not None and declared and declared.isdigit() and int(declared) > max_bytes:
                raise ImageSearchError("invalid", "too large")
            body = response.read(max_bytes + 1) if max_bytes is not None else response.read()
            if max_bytes is not None and len(body) > max_bytes:
                raise ImageSearchError("invalid", "too large")
            return response.status, {k.lower(): v for k, v in response.headers.items()}, body
    except ImageSearchError:
        raise
    except urllib.error.HTTPError as e:
        if e.code in (401, 403, 429):
            raise ImageSearchError("limited", f"http {e.code}") from e
        raise ImageSearchError("network", f"http {e.code}") from e
    except Exception as e:  # timeout, DNS, SSL...
        raise ImageSearchError("network", repr(e)) from e


# ---------------------------------------------------------------- Wikimedia Commons

_TAGS = re.compile(r"<[^>]*>")


def _plain(text):
    return re.sub(r"\s+", " ", html.unescape(_TAGS.sub("", text or ""))).strip()


def commons_license_ok(name):
    """Giay phep cho phep dung lai + chinh sua: CC0, CC BY, CC BY-SA, Public domain (khong -NC, -ND, fair use)."""
    lowered = (name or "").lower().strip()
    if not lowered.startswith(cfg.COMMONS_LICENSE_PREFIXES):
        return False
    tokens = re.split(r"[\s\-_/]+", lowered)
    return not any(t in cfg.REJECTED_LICENSE_TOKENS for t in tokens)


def search_commons(keyword):
    params = {
        "action": "query", "generator": "search", "gsrnamespace": 6, "gsrsearch": f"{keyword} {cfg.SEARCH_SUFFIX} filetype:bitmap",
        "gsrlimit": cfg.MAX_RESULTS * 2, "prop": "imageinfo", "iiprop": "url|mime|size|extmetadata",
        "iiurlwidth": 640, "format": "json",
    }
    _, _, body = http_get(cfg.COMMONS_API + "?" + urllib.parse.urlencode(params), cfg.TIMEOUT_SECONDS[cfg.SOURCE_COMMONS],
                          {"Accept": "application/json"})
    try:
        pages = (json.loads(body).get("query") or {}).get("pages") or {}
    except ValueError as e:
        raise ImageSearchError("network", "bad json") from e
    out = []
    for page in sorted(pages.values(), key=lambda p: p.get("index", 0)):
        info = (page.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata") or {}
        license_name = (meta.get("LicenseShortName") or {}).get("value", "")
        url = info.get("thumburl") or info.get("url") or ""
        if info.get("mime") not in cfg.ALLOWED_IMAGE_MIME or not commons_license_ok(license_name) or not is_allowed_url(url):
            continue
        title = re.sub(r"\.\w+$", "", (page.get("title") or "").replace("File:", "", 1))
        out.append({
            "url": url, "mime": info.get("mime"), "title": title,
            "author": _plain((meta.get("Artist") or {}).get("value", "")), "license": _plain(license_name),
            "source_url": info.get("descriptionurl") or "",
        })
    return out


# ---------------------------------------------------------------- Openverse

_token_lock = threading.Lock()
_openverse_token = {"value": None}


def _openverse_auth_header():
    """Khoa Openverse tuy chon (bien moi truong); khong co hoac loi thi goi an danh."""
    client_id = os.environ.get(cfg.OPENVERSE_CLIENT_ID_ENV)
    client_secret = os.environ.get(cfg.OPENVERSE_CLIENT_SECRET_ENV)
    if not client_id or not client_secret:
        return {}
    with _token_lock:
        if not _openverse_token["value"]:
            data = urllib.parse.urlencode(
                {"grant_type": "client_credentials", "client_id": client_id, "client_secret": client_secret}
            ).encode()
            try:
                _, _, body = http_get(cfg.OPENVERSE_TOKEN_URL, cfg.TIMEOUT_SECONDS[cfg.SOURCE_OPENVERSE], data=data)
                _openverse_token["value"] = json.loads(body).get("access_token")
            except (ImageSearchError, ValueError):
                return {}
        token = _openverse_token["value"]
    return {"Authorization": f"Bearer {token}"} if token else {}


def search_openverse(keyword):
    params = {"q": f"{keyword} {cfg.SEARCH_SUFFIX}", "license": ",".join(cfg.OPENVERSE_LICENSES), "page_size": cfg.MAX_RESULTS * 2}
    _, _, body = http_get(cfg.OPENVERSE_API + "?" + urllib.parse.urlencode(params), cfg.TIMEOUT_SECONDS[cfg.SOURCE_OPENVERSE],
                          dict({"Accept": "application/json"}, **_openverse_auth_header()))
    try:
        results = json.loads(body).get("results") or []
    except ValueError as e:
        raise ImageSearchError("network", "bad json") from e
    out = []
    for r in results:
        code = (r.get("license") or "").lower()
        url = r.get("thumbnail") or ""
        if code not in cfg.OPENVERSE_LICENSES or r.get("mature") or not is_allowed_url(url):
            continue
        version = r.get("license_version")
        license_name = cfg.OPENVERSE_LICENSES[code] + (f" {version}" if version and code in ("by", "by-sa") else "")
        out.append({
            "url": url, "mime": None, "title": r.get("title") or "", "author": r.get("creator") or "",
            "license": license_name, "source_url": r.get("foreign_landing_url") or "",
        })
    return out


SEARCHERS = {cfg.SOURCE_COMMONS: search_commons, cfg.SOURCE_OPENVERSE: search_openverse}


# ---------------------------------------------------------------- Tai anh

def fetch_image(url):
    """Tai 1 anh da duoc service liet ke. Tra (bytes, mime). Sai host/loai/qua lon -> ImageSearchError("invalid")."""
    _, headers, body = http_get(url, cfg.FETCH_TIMEOUT_SECONDS, {"Accept": "image/*"}, max_bytes=cfg.MAX_IMAGE_BYTES)
    mime = (headers.get("content-type") or "").split(";")[0].strip().lower()
    if mime not in cfg.ALLOWED_IMAGE_MIME:
        raise ImageSearchError("invalid", f"type {mime}")
    return body, mime
