"""Route tu vung: chi doc request, goi word_service, tra JSON."""

from flask import Blueprint, jsonify, request

from ankitool.services import word_service

word_bp = Blueprint("word", __name__)


@word_bp.route("/api/words", methods=["GET"])
def list_words():
    return jsonify(word_service.list_words())


@word_bp.route("/api/words", methods=["POST"])
def add_word():
    word = word_service.add_word(request.form, request.files)
    return jsonify(word), 201


@word_bp.route("/api/words/<word_id>", methods=["PUT"])
def update_word(word_id):
    return jsonify(word_service.update_word(word_id, request.form, request.files))


@word_bp.route("/api/words/<word_id>", methods=["DELETE"])
def delete_word(word_id):
    word_service.delete_word(word_id)
    return jsonify({"ok": True})
