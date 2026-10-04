"""Route nhap tu hang loat tu CSV: chi doc request, goi word_import_service, tra JSON."""

from flask import Blueprint, jsonify, request

from ankitool.services import word_import_service

word_import_bp = Blueprint("word_import", __name__)


@word_import_bp.route("/api/words/import/preview", methods=["POST"])
def preview_import():
    data = request.get_json(silent=True) or {}
    return jsonify(word_import_service.preview(data.get("csv")))


@word_import_bp.route("/api/words/import", methods=["POST"])
def import_words():
    data = request.get_json(silent=True) or {}
    return jsonify(word_import_service.import_rows(data.get("rows")))
