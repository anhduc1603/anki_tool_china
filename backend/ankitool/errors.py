"""
Loi nghiep vu co ma HTTP. Service/repository chi can raise; handler duy nhat ben duoi
doi thanh JSON {"error": thong_bao} voi dung ma trang thai.
"""

from flask import jsonify


class AppError(Exception):
    status_code = 500

    def __init__(self, message, status_code=None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code


class ValidationError(AppError):
    status_code = 400


class NotFoundError(AppError):
    status_code = 404


def register_error_handlers(app):
    @app.errorhandler(AppError)
    def handle_app_error(error):
        return jsonify({"error": error.message}), error.status_code
