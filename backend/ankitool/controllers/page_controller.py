"""Trang chu: phuc vu frontend/index.html (tai nguyen tinh nam o /static/... do Flask static_folder)."""

from flask import Blueprint, current_app, send_from_directory

page_bp = Blueprint("page", __name__)


@page_bp.route("/")
def index():
    return send_from_directory(current_app.static_folder, "index.html")
