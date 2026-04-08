from __future__ import annotations

import os
from typing import Any

from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures
from azure.core.credentials import AzureKeyCredential


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing `{name}` in `.env`.")
    return value


def _build_client() -> ImageAnalysisClient:
    endpoint = _require_env("AI_SERVICE_ENDPOINT")
    key = _require_env("AI_SERVICE_KEY")
    return ImageAnalysisClient(endpoint=endpoint, credential=AzureKeyCredential(key))


def _bounding_box_to_dict(bounding_box: Any) -> dict[str, Any] | None:
    if bounding_box is None:
        return None

    return {
        "x": getattr(bounding_box, "x", None),
        "y": getattr(bounding_box, "y", None),
        "width": getattr(bounding_box, "width", getattr(bounding_box, "w", None)),
        "height": getattr(bounding_box, "height", getattr(bounding_box, "h", None)),
    }


def analyze_image(image_data: bytes) -> dict[str, Any]:
    client = _build_client()
    result = client.analyze(
        image_data=image_data,
        visual_features=[
            VisualFeatures.CAPTION,
            VisualFeatures.DENSE_CAPTIONS,
            VisualFeatures.TAGS,
            VisualFeatures.OBJECTS,
            VisualFeatures.PEOPLE,
        ],
    )

    dense_captions = [
        {
            "text": caption.text,
            "confidence": round(caption.confidence * 100, 2),
        }
        for caption in getattr(getattr(result, "dense_captions", None), "list", [])
    ]

    tags = [
        {
            "name": tag.name,
            "confidence": round(tag.confidence * 100, 2),
        }
        for tag in getattr(getattr(result, "tags", None), "list", [])
    ]

    objects = []
    for detected_object in getattr(getattr(result, "objects", None), "list", []):
        object_name = "object"
        if getattr(detected_object, "tags", None):
            object_name = detected_object.tags[0].name

        object_confidence = None
        if getattr(detected_object, "tags", None):
            object_confidence = round(detected_object.tags[0].confidence * 100, 2)

        objects.append(
            {
                "name": object_name,
                "confidence": object_confidence,
                "bounding_box": _bounding_box_to_dict(detected_object.bounding_box),
            }
        )

    people = [
        {
            "confidence": round(person.confidence * 100, 2),
            "bounding_box": _bounding_box_to_dict(person.bounding_box),
        }
        for person in getattr(getattr(result, "people", None), "list", [])
    ]

    caption = getattr(result, "caption", None)

    return {
        "caption": caption.text if caption else "",
        "caption_confidence": round(caption.confidence * 100, 2) if caption else None,
        "dense_captions": dense_captions,
        "tags": tags,
        "objects": objects,
        "people": people,
        "summary": {
            "tag_count": len(tags),
            "object_count": len(objects),
            "people_count": len(people),
        },
    }



