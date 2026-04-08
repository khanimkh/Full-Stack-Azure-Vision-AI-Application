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


def _normalize_polygon(polygon: Any) -> list[dict[str, float]]:
    points: list[dict[str, float]] = []
    for point in polygon or []:
        x = getattr(point, "x", None)
        y = getattr(point, "y", None)

        if x is None and y is None and isinstance(point, (list, tuple)) and len(point) >= 2:
            x, y = point[0], point[1]

        if x is not None and y is not None:
            points.append({"x": float(x), "y": float(y)})

    return points


def _polygon_to_box(points: list[dict[str, float]]) -> dict[str, float] | None:
    if not points:
        return None

    xs = [point["x"] for point in points]
    ys = [point["y"] for point in points]
    return {
        "left": min(xs),
        "top": min(ys),
        "width": max(xs) - min(xs),
        "height": max(ys) - min(ys),
    }


def read_text(image_data: bytes) -> dict[str, Any]:
    client = _build_client()
    result = client.analyze(
        image_data=image_data,
        visual_features=[VisualFeatures.READ],
    )

    lines = []
    for block in getattr(getattr(result, "read", None), "blocks", []):
        for line in getattr(block, "lines", []):
            polygon = _normalize_polygon(getattr(line, "bounding_polygon", None))
            lines.append(
                {
                    "text": line.text,
                    "bounding_polygon": polygon,
                    "bounding_box": _polygon_to_box(polygon),
                }
            )

    return {
        "line_count": len(lines),
        "lines": lines,
        "text": "\n".join(line["text"] for line in lines),
    }
