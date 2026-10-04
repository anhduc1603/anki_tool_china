"""Route danh muc (va gan tu vao danh muc): chi doc request, goi category_service, tra JSON."""

from flask import Blueprint, jsonify, request

from ankitool.services import category_service

category_bp = Blueprint("category", __name__)


@category_bp.route("/api/categories", methods=["GET"])
def list_categories():
    return jsonify(category_service.list_categories())


@category_bp.route("/api/categories", methods=["POST"])
def create_category():
    data = request.get_json(silent=True) or {}
    category = category_service.create_category(data.get("name"), data.get("parent_id"))
    return jsonify(category), 201


@category_bp.route("/api/categories/<category_id>", methods=["PUT"])
def rename_category(category_id):
    data = request.get_json(silent=True) or {}
    category_service.rename_category(category_id, data.get("name"))
    return jsonify({"ok": True})


@category_bp.route("/api/categories/<category_id>", methods=["DELETE"])
def delete_category(category_id):
    category_service.delete_category(category_id)
    return jsonify({"ok": True})


@category_bp.route("/api/words/<word_id>/category", methods=["PUT"])
def assign_word_category(word_id):
    data = request.get_json(silent=True) or {}
    category_service.assign_word(word_id, data.get("category_id"))
    return jsonify({"ok": True})
