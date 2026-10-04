"""Route file media (anh, audio) va sinh audio (TTS)."""

from flask import Blueprint, jsonify, request, send_from_directory

from ankitool.config.settings import get_config
from ankitool.services import media_service

media_bp = Blueprint("media", __name__)


@media_bp.route("/media/<path:filename>")
def media(filename):
    return send_from_directory(get_config().media_dir, filename)


@media_bp.route("/api/tts", methods=["POST"])
def tts():
    data = request.get_json(silent=True) or {}
    audio_name = media_service.synthesize_speech(data.get("text"))
    return jsonify({"audio_url": f"/media/{audio_name}"})
