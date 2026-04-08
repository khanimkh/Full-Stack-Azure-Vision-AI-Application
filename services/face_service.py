from __future__ import annotations

import os
from typing import Any

import requests


def _get_setting(primary_name: str, fallback_name: str | None = None) -> str:
    value = os.getenv(primary_name)
    if value:
        return value

    if fallback_name:
        value = os.getenv(fallback_name)
        if value:
            return value

    missing_name = primary_name if not fallback_name else f"{primary_name}` or `{fallback_name}"
    raise ValueError(f"Missing `{missing_name}` in `.env`.")


def detect_faces(image_data: bytes) -> dict[str, Any]:
    endpoint = _get_setting("FACE_API_ENDPOINT", "AI_SERVICE_ENDPOINT").rstrip("/")
    key = _get_setting("FACE_API_KEY", "AI_SERVICE_KEY")

    if endpoint.endswith("/face/v1.0"):
        face_url = f"{endpoint}/detect"
    else:
        face_url = f"{endpoint}/face/v1.0/detect"

    response = requests.post(
        face_url,
        params={
            "returnFaceId": "false",
            "returnFaceAttributes": "glasses,blur,exposure,headpose,noise",
        },
        headers={
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "application/octet-stream",
        },
        data=image_data,
        timeout=60,
    )

    if not response.ok:
        try:
            details: Any = response.json()
        except ValueError:
            details = response.text
        raise RuntimeError(f"Azure Face API error {response.status_code}: {details}")

    faces = response.json()
    return {
        "face_count": len(faces),
        "faces": [
            {
                "face_rectangle": face.get("faceRectangle"),
                "face_attributes": face.get("faceAttributes", {}),
            }
            for face in faces
        ],
    }
