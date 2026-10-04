"""Hang so cho anh upload, audio (TTS) va xuat file."""

ALLOWED_IMAGE_EXT = {".gif", ".png", ".jpg", ".jpeg", ".webp", ".svg"}
# Ten field upload dung chung cho anh goi nho va gif net viet
IMAGE_FIELDS = ("mnemonic", "gif")

TTS_VOICE = "zh-CN-XiaoxiaoNeural"  # giong nu chuan Bac Kinh, doc ro rang
AUDIO_NAME_HASH_LENGTH = 10  # ten file audio = md5(text)[:10] + ".mp3" (giu nguyen de cache cu con dung)
AUDIO_EXTENSION = ".mp3"

DEFAULT_DECK_NAME = "ChineseDeck"
EXPORT_MIMETYPE = "application/octet-stream"

# Thu muc cache audio cua cong cu dong lenh (tuong doi voi noi chay lenh)
CLI_MEDIA_DIR = "_media_cache"
