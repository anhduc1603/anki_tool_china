"""Route cai dat: chi doc request, goi settings_service, tra JSON."""

from flask import Blueprint, jsonify, request

from ankitool.services import settings_service

settings_bp = Blueprint("settings", __name__)


@settings_bp.route("/api/settings", methods=["GET"])
def get_settings():
    return jsonify({"settings": settings_service.get_settings(), "defaults": settings_service.default_settings()})


@settings_bp.route("/api/settings", methods=["PUT"])
def update_settings():
    data = request.get_json(silent=True)
    return jsonify({"settings": settings_service.update_settings(data)})
