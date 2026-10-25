"""Route goi y anh minh hoa: tim anh (theo nguon) va lay anh theo token. Chi doc request, goi service."""

from flask import Blueprint, Response, jsonify, request

from ankitool.services import image_suggestion_service

image_bp = Blueprint("image", __name__)


@image_bp.route("/api/images/search", methods=["GET"])
def search_images():
    return jsonify(image_suggestion_service.search(request.args.get("q"), request.args.get("source", "")))


@image_bp.route("/api/images/<token>/file", methods=["GET"])
def image_file(token):
    data, mime = image_suggestion_service.get_image(token)
    return Response(data, mimetype=mime, headers={"Cache-Control": "private, max-age=600"})
