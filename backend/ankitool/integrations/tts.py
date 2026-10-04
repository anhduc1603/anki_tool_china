"""Sinh audio phat am tieng Trung bang edge-tts (cache theo hash cua text)."""

import asyncio
import hashlib
import os

import edge_tts

from ankitool.constants.media import AUDIO_EXTENSION, AUDIO_NAME_HASH_LENGTH, TTS_VOICE


def audio_filename_for(text: str) -> str:
    h = hashlib.md5(text.encode("utf-8")).hexdigest()[:AUDIO_NAME_HASH_LENGTH]
    return f"{h}{AUDIO_EXTENSION}"


async def _synthesize_audio(text: str, out_path: str):
    communicate = edge_tts.Communicate(text, TTS_VOICE)
    await communicate.save(out_path)


def ensure_audio(text: str, media_dir: str) -> str:
    """Sinh (neu chua co san) audio phat am cho `text`, tra ve duong dan file.

    Cache theo hash cua text nen cung mot tu chi sinh audio 1 lan.
    """
    os.makedirs(media_dir, exist_ok=True)
    filename = audio_filename_for(text)
    out_path = os.path.join(media_dir, filename)
    if not os.path.exists(out_path):
        asyncio.run(_synthesize_audio(text, out_path))
    return out_path
