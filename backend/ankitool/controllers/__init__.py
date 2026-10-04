"""Controller (Flask Blueprint). Moi file mot nhom route; them nhom moi thi dang ky o day."""

from ankitool.controllers.category_controller import category_bp
from ankitool.controllers.export_controller import export_bp
from ankitool.controllers.media_controller import media_bp
from ankitool.controllers.page_controller import page_bp
from ankitool.controllers.settings_controller import settings_bp
from ankitool.controllers.study_controller import study_bp
from ankitool.controllers.word_controller import word_bp
from ankitool.controllers.word_import_controller import word_import_bp

BLUEPRINTS = (page_bp, word_bp, word_import_bp, category_bp, study_bp, settings_bp, media_bp, export_bp)


def register_blueprints(app):
    for blueprint in BLUEPRINTS:
        app.register_blueprint(blueprint)
