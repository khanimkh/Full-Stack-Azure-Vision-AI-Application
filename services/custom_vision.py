from __future__ import annotations

import os
from typing import Any

from azure.cognitiveservices.vision.customvision.prediction import CustomVisionPredictionClient
from msrest.authentication import ApiKeyCredentials


def _get_setting(*names: str) -> str:
    for name in names:
        value = os.getenv(name)
        if value:
            return value

    choices = ", ".join(f"`{name}`" for name in names)
    raise ValueError(f"Missing configuration. Set one of these values in `.env`: {choices}.")


def _build_prediction_client(prefix: str) -> tuple[CustomVisionPredictionClient, str, str]:
    endpoint = _get_setting(f"{prefix}_PREDICTION_ENDPOINT", "PredictionEndpoint")
    key = _get_setting(f"{prefix}_PREDICTION_KEY", "PredictionKey")
    project_id = _get_setting(f"{prefix}_PROJECT_ID", "ProjectID")
    model_name = _get_setting(f"{prefix}_MODEL_NAME", "ModelName")

    credentials = ApiKeyCredentials(in_headers={"Prediction-key": key})
    client = CustomVisionPredictionClient(endpoint=endpoint, credentials=credentials)
    return client, project_id, model_name


def classify_image(image_data: bytes) -> dict[str, Any]:
    client, project_id, model_name = _build_prediction_client("CLASSIFICATION")
    result = client.classify_image(project_id, model_name, image_data)

    predictions = sorted(
        [
            {
                "tag_name": prediction.tag_name,
                "probability": round(prediction.probability * 100, 2),
            }
            for prediction in result.predictions
        ],
        key=lambda item: item["probability"],
        reverse=True,
    )

    return {
        "top_prediction": predictions[0] if predictions else None,
        "predictions": predictions,
    }


def detect_objects(image_data: bytes) -> dict[str, Any]:
    client, project_id, model_name = _build_prediction_client("OBJECT_DETECTION")
    result = client.detect_image(project_id, model_name, image_data)

    predictions: list[dict[str, Any]] = []
    for prediction in result.predictions:
        predictions.append(
            {
                "tag_name": prediction.tag_name,
                "probability": round(prediction.probability * 100, 2),
                "bounding_box": {
                    "left": round(prediction.bounding_box.left, 4),
                    "top": round(prediction.bounding_box.top, 4),
                    "width": round(prediction.bounding_box.width, 4),
                    "height": round(prediction.bounding_box.height, 4),
                },
            }
        )

    predictions.sort(key=lambda item: item["probability"], reverse=True)

    return {
        "object_count": len(predictions),
        "predictions": predictions,
    }
