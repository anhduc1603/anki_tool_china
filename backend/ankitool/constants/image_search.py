"""Hang so cho tinh nang goi y anh minh hoa (tim tren kho anh mien phi, xem services/image_suggestion_service.py)."""

SOURCE_COMMONS = "commons"
SOURCE_OPENVERSE = "openverse"
SEARCH_SOURCES = (SOURCE_COMMONS, SOURCE_OPENVERSE)

# Trang thai 1 lan tim tra cho giao dien
STATUS_OK = "ok"
STATUS_ERROR = "error"
STATUS_LIMITED = "limited"

# Tu them vao sau tu khoa khi tim, de ra tranh minh hoa thay vi anh dai (nguoi dung khong thay o o tu khoa)
SEARCH_SUFFIX = "illustration"
MAX_RESULTS = 6
KEYWORD_MAX_LENGTH = 100
# Commons tra loi trong 1-2 giay; Openverse an danh cham (17-20 giay khi do thu) nen co timeout rieng
TIMEOUT_SECONDS = {SOURCE_COMMONS: 8, SOURCE_OPENVERSE: 25}
FETCH_TIMEOUT_SECONDS = 10

# Anh tai ve: toi da 3 MB, chi cac loai nay (khong SVG vi co the chua script)
MAX_IMAGE_BYTES = 3 * 1024 * 1024
ALLOWED_IMAGE_MIME = {"image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp"}

# Chi duoc goi/tai tu cac host nay (khop theo hau to, ke ca sau chuyen huong)
ALLOWED_HOST_SUFFIXES = ("wikimedia.org", "openverse.org")

USER_AGENT = "AnkiTool/1.0 (personal flashcard app)"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
OPENVERSE_API = "https://api.openverse.org/v1/images/"
OPENVERSE_TOKEN_URL = "https://api.openverse.org/v1/auth_tokens/token/"
OPENVERSE_CLIENT_ID_ENV = "OPENVERSE_CLIENT_ID"
OPENVERSE_CLIENT_SECRET_ENV = "OPENVERSE_CLIENT_SECRET"

# Giay phep cho phep dung lai va chinh sua (Openverse: ma giay phep; Commons: LicenseShortName)
OPENVERSE_LICENSES = {"cc0": "CC0", "pdm": "Public Domain", "by": "CC BY", "by-sa": "CC BY-SA"}
COMMONS_LICENSE_PREFIXES = ("cc0", "cc by", "public domain", "pd")
# Token giay phep bi loai (phi thuong mai, cam chinh sua, fair use...)
REJECTED_LICENSE_TOKENS = ("nc", "nd", "fair", "non")

# Bo nho trong tien trinh
CANDIDATE_TTL_SECONDS = 30 * 60
CANDIDATE_MAX = 300
SEARCH_CACHE_TTL_SECONDS = 10 * 60
SEARCH_CACHE_MAX = 100
IMAGE_CACHE_MAX = 40
