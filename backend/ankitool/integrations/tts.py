"""Sinh audio phat am tieng Trung bang edge-tts (cache theo hash cua text)."""

import asyncio
import hashlib
import logging
import os

import edge_tts

from ankitool.constants.media import AUDIO_EXTENSION, AUDIO_NAME_HASH_LENGTH, TTS_VOICE

logger = logging.getLogger(__name__)

DEFAULT_CONCURRENCY = 5  # so audio sinh dong thoi khi xuat (vua du de khong cham, khong qua nhieu cho edge-tts)


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


async def _synthesize_many(jobs, concurrency):
    """jobs: [(text, out_path)]. Tra ve {text: True/False}; loi tung van ban chi ghi log.
    Ghi ra file tam roi doi ten de khong de lai file hong (se bi coi la cache hop le o lan sau)."""
    semaphore = asyncio.Semaphore(concurrency)
    results = {}

    async def run(text, out_path):
        part = out_path + ".part"
        async with semaphore:
            try:
                await _synthesize_audio(text, part)
                os.replace(part, out_path)
                results[text] = True
            except Exception as e:  # noqa: BLE001 - mot cau loi khong duoc chan ca lan xuat
                logger.warning("Khong sinh duoc audio cho %r: %s", text, e)
                results[text] = False
                try:
                    os.remove(part)
                except OSError:
                    pass

    await asyncio.gather(*(run(text, path) for text, path in jobs))
    return results


def ensure_audio_many(texts, media_dir: str, concurrency: int = DEFAULT_CONCURRENCY) -> dict:
    """Sinh (neu chua co) audio cho nhieu van ban cung luc. Tra ve {text: duong_dan_file | None}
    (None = khong sinh duoc). Van ban rong bi bo qua; van ban trung chi sinh mot lan; file da co duoc dung lai."""
    os.makedirs(media_dir, exist_ok=True)
    paths = {}
    jobs = []
    for text in dict.fromkeys(t for t in texts if t):
        out_path = os.path.join(media_dir, audio_filename_for(text))
        paths[text] = out_path
        if not os.path.exists(out_path):
            jobs.append((text, out_path))
    if jobs:
        results = asyncio.run(_synthesize_many(jobs, max(1, concurrency)))
        for text, ok in results.items():
            if not ok:
                paths[text] = None
    return paths
