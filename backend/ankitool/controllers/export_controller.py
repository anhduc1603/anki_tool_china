"""Route xuat .apkg: chi doc request, goi export_service, tra file."""

from flask import Blueprint, request, send_file

from ankitool.constants.media import EXPORT_MIMETYPE
from ankitool.services import export_service

export_bp = Blueprint("export", __name__)


@export_bp.route("/api/export", methods=["GET"])
def export():
    path, download_name = export_service.build_export(request.args.get("deck_name"))
    return send_file(
        path,
        as_attachment=True,
        download_name=download_name,
        mimetype=EXPORT_MIMETYPE,
    )
