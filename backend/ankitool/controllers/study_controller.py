"""Route hoc/on tap: chi doc request, goi study_service, tra JSON."""

from flask import Blueprint, jsonify, request

from ankitool.services import study_service

study_bp = Blueprint("study", __name__)


@study_bp.route("/api/study/due", methods=["GET"])
def due_words():
    scope = request.args.get("category_id") or None
    return jsonify(study_service.get_due_words(scope))


@study_bp.route("/api/study/counts", methods=["GET"])
def due_counts():
    return jsonify(study_service.get_due_counts())


@study_bp.route("/api/study/bury/<word_id>", methods=["POST"])
def bury(word_id):
    return jsonify(study_service.bury_word(word_id))


@study_bp.route("/api/study/buried", methods=["GET"])
def buried():
    scope = request.args.get("category_id") or None
    return jsonify({"count": study_service.buried_count(scope)})


@study_bp.route("/api/study/unbury", methods=["POST"])
def unbury():
    data = request.get_json(silent=True) or {}
    return jsonify({"count": study_service.unbury(data.get("category_id") or None)})


@study_bp.route("/api/study/review/<word_id>", methods=["POST"])
def review(word_id):
    data = request.get_json(silent=True) or {}
    return jsonify(study_service.review(word_id, data.get("grade")))
