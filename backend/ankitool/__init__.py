"""AnkiTool backend: app factory create_app()."""

import mimetypes
import os

from flask import Flask

from ankitool.config.settings import AppConfig, set_config
from ankitool.controllers import register_blueprints
from ankitool.database.schema import init_database
from ankitool.errors import register_error_handlers


def create_app(config=None):
    config = set_config(config or AppConfig.from_env())

    # Windows khong luon co san mapping nay trong registry, ma khong co thi trinh
    # duyet co the khong hien duoc anh SVG khi xem preview.
    mimetypes.add_type("image/svg+xml", ".svg")

    os.makedirs(config.media_dir, exist_ok=True)
    init_database()

    app = Flask(__name__, static_folder=config.frontend_dir, static_url_path="/static")
    app.config["MAX_CONTENT_LENGTH"] = config.max_content_length
    register_error_handlers(app)
    register_blueprints(app)
    return app
