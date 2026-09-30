"""
Web app local de nhap tu vung tieng Trung va xuat file .apkg cho Anki.

Chay:
    python app.py

Roi mo trinh duyet: http://127.0.0.1:5000
"""

import json
import mimetypes
import os
import sys
import tempfile
import uuid

from flask import Flask, jsonify, render_template, request, send_file, send_from_directory

import anki_builder

# Windows khong luon co san mapping nay trong registry, ma khong co thi trinh
# duyet co the khong hien duoc anh SVG khi xem preview.
mimetypes.add_type("image/svg+xml", ".svg")

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MEDIA_DIR = os.path.join(DATA_DIR, "media")
WORDS_FILE = os.path.join(DATA_DIR, "words.json")

os.makedirs(MEDIA_DIR, exist_ok=True)

ALLOWED_IMAGE_EXT = {".gif", ".png", ".jpg", ".jpeg", ".webp", ".svg"}
IMAGE_FIELDS = ("mnemonic", "gif")  # ten field upload dung chung cho anh goi nho va gif net viet

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB moi request


def load_words():
    if not os.path.exists(WORDS_FILE):
        return []
    with open(WORDS_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_words(words):
    with open(WORDS_FILE, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, indent=2)


def find_word(words, word_id):
    for w in words:
        if w["id"] == word_id:
            return w
    return None


def save_uploaded_image(file_storage):
    ext = os.path.splitext(file_storage.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXT:
        return None, f"Dinh dang file khong ho tro: {ext or '(khong ro)'}"
    filename = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(MEDIA_DIR, filename)
    file_storage.save(path)
    return filename, None


def apply_image_upload_for_new_word(word, field_name):
    """field_name: 'mnemonic' hoac 'gif'. Set word[f'{field_name}_filename'] neu co file upload."""
    file = request.files.get(field_name)
    if file and file.filename:
        filename, err = save_uploaded_image(file)
        if err:
            return err
        word[f"{field_name}_filename"] = filename
    return None


def apply_image_upload_for_edit(word, field_name):
    """field_name: 'mnemonic' hoac 'gif'. Cap nhat/xoa anh theo request hien tai."""
    file = request.files.get(field_name)
    if file and file.filename:
        filename, err = save_uploaded_image(file)
        if err:
            return err
        word[f"{field_name}_filename"] = filename
    elif request.form.get(f"remove_{field_name}") == "1":
        word[f"{field_name}_filename"] = None
    return None


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/media/<path:filename>")
def media(filename):
    return send_from_directory(MEDIA_DIR, filename)


@app.route("/api/words", methods=["GET"])
def api_list_words():
    return jsonify(load_words())


@app.route("/api/words", methods=["POST"])
def api_add_word():
    hanzi = (request.form.get("hanzi") or "").strip()
    pinyin = (request.form.get("pinyin") or "").strip()
    meaning = (request.form.get("meaning") or "").strip()
    example = (request.form.get("example") or "").strip()

    if not hanzi or not pinyin or not meaning:
        return jsonify({"error": "Thieu chu Han, pinyin hoac nghia."}), 400

    word = {
        "id": uuid.uuid4().hex,
        "hanzi": hanzi,
        "pinyin": pinyin,
        "meaning": meaning,
        "example": example,
        "mnemonic_filename": None,
        "gif_filename": None,
        "audio_filename": None,
    }

    for field_name in IMAGE_FIELDS:
        err = apply_image_upload_for_new_word(word, field_name)
        if err:
            return jsonify({"error": err}), 400

    try:
        audio_path = anki_builder.ensure_audio(hanzi, MEDIA_DIR)
    except Exception as e:
        return jsonify({"error": f"Loi sinh audio: {e}"}), 500
    word["audio_filename"] = os.path.basename(audio_path)

    words = load_words()
    words.append(word)
    save_words(words)

    return jsonify(word), 201


@app.route("/api/words/<word_id>", methods=["PUT"])
def api_update_word(word_id):
    words = load_words()
    word = find_word(words, word_id)
    if not word:
        return jsonify({"error": "Khong tim thay tu."}), 404

    hanzi = (request.form.get("hanzi") or "").strip()
    pinyin = (request.form.get("pinyin") or "").strip()
    meaning = (request.form.get("meaning") or "").strip()
    example = (request.form.get("example") or "").strip()

    if not hanzi or not pinyin or not meaning:
        return jsonify({"error": "Thieu chu Han, pinyin hoac nghia."}), 400

    for field_name in IMAGE_FIELDS:
        err = apply_image_upload_for_edit(word, field_name)
        if err:
            return jsonify({"error": err}), 400

    try:
        audio_path = anki_builder.ensure_audio(hanzi, MEDIA_DIR)
    except Exception as e:
        return jsonify({"error": f"Loi sinh audio: {e}"}), 500

    word.update(
        {
            "hanzi": hanzi,
            "pinyin": pinyin,
            "meaning": meaning,
            "example": example,
            "audio_filename": os.path.basename(audio_path),
        }
    )

    save_words(words)
    return jsonify(word)


@app.route("/api/words/<word_id>", methods=["DELETE"])
def api_delete_word(word_id):
    words = load_words()
    new_words = [w for w in words if w["id"] != word_id]
    if len(new_words) == len(words):
        return jsonify({"error": "Khong tim thay tu."}), 404
    save_words(new_words)
    return jsonify({"ok": True})


@app.route("/api/tts", methods=["POST"])
def api_tts():
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "Thieu noi dung can doc."}), 400
    try:
        audio_path = anki_builder.ensure_audio(text, MEDIA_DIR)
    except Exception as e:
        return jsonify({"error": f"Loi sinh audio: {e}"}), 500
    return jsonify({"audio_url": f"/media/{os.path.basename(audio_path)}"})


@app.route("/api/export", methods=["GET"])
def api_export():
    deck_name = (request.args.get("deck_name") or "ChineseDeck").strip() or "ChineseDeck"
    words = load_words()
    if not words:
        return jsonify({"error": "Danh sach tu dang trong."}), 400

    build_words = []
    for w in words:
        mnemonic_path = None
        if w.get("mnemonic_filename"):
            mnemonic_path = os.path.join(MEDIA_DIR, w["mnemonic_filename"])
        gif_path = None
        if w.get("gif_filename"):
            gif_path = os.path.join(MEDIA_DIR, w["gif_filename"])
        build_words.append(
            {
                "hanzi": w["hanzi"],
                "pinyin": w["pinyin"],
                "meaning": w["meaning"],
                "example": w.get("example", ""),
                "mnemonic_path": mnemonic_path,
                "gif_path": gif_path,
            }
        )

    tmp = tempfile.NamedTemporaryFile(suffix=".apkg", delete=False)
    tmp.close()
    try:
        anki_builder.build_apkg(build_words, MEDIA_DIR, tmp.name, deck_name)
        return send_file(
            tmp.name,
            as_attachment=True,
            download_name=f"{deck_name}.apkg",
            mimetype="application/octet-stream",
        )
    except Exception as e:
        return jsonify({"error": f"Loi xuat file: {e}"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
