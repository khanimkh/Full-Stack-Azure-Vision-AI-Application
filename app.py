from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

from services.azure_vision import analyze_image
from services.custom_vision import classify_image, detect_objects
from services.face_service import detect_faces
from services.ocr_service import read_text

app = Flask(__name__, template_folder="templates", static_folder="static")


def _json_error(message: str, status_code: int = 400):
    return jsonify({"ok": False, "error": message}), status_code


def _read_upload(field_name: str = "image") -> bytes:
    uploaded_file = request.files.get(field_name)
    if uploaded_file is None or uploaded_file.filename == "":
        raise ValueError("Please choose an image file before sending the request.")

    file_bytes = uploaded_file.read()
    if not file_bytes:
        raise ValueError("The uploaded file is empty.")

    return file_bytes


def _handle_service(service_callback):
    try:
        payload = service_callback()
        return jsonify({"ok": True, "result": payload})
    except ValueError as exc:
        return _json_error(str(exc), 400)
    except Exception as exc:
        return _json_error(str(exc), 500)


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "status": "ready"})


@app.post("/api/analyze-image")
def api_analyze_image():
    return _handle_service(lambda: analyze_image(_read_upload()))


@app.post("/api/classify-image")
def api_classify_image():
    return _handle_service(lambda: classify_image(_read_upload()))


@app.post("/api/detect-objects")
def api_detect_objects():
    return _handle_service(lambda: detect_objects(_read_upload()))


@app.post("/api/detect-faces")
def api_detect_faces():
    return _handle_service(lambda: detect_faces(_read_upload()))


@app.post("/api/read-text")
def api_read_text():
    return _handle_service(lambda: read_text(_read_upload()))


if __name__ == "__main__":
    host = os.getenv("FLASK_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "false").lower() in {"1", "true", "yes", "on"}
    app.run(debug=debug, host=host, port=port)
