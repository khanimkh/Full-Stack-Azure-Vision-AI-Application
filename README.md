# Azure Vision Web App

A compact **Flask + Azure AI Vision** web app that combines the lab exercises into one browser-based demo. It lets you upload an image and test multiple Azure vision capabilities from a single page.

## ✨ Features

- **Image analysis**: captions, dense captions, tags, objects, and people
- **OCR / Read**: extracts text and bounding boxes from images
- **Image classification**: uses a published Custom Vision classification model
- **Object detection**: uses a published Custom Vision detection model
- **Face detection**: detects faces and selected face attributes

---

## 🧭 Service mapping

| Capability | API route | Backend module |
| --- | --- | --- |
| Analyze image | `/api/analyze-image` | `services/azure_vision.py` |
| Classify image | `/api/classify-image` | `services/custom_vision.py` |
| Detect objects | `/api/detect-objects` | `services/custom_vision.py` |
| Detect faces | `/api/detect-faces` | `services/face_service.py` |
| Read text | `/api/read-text` | `services/ocr_service.py` |
| Health check | `/api/health` | `app.py` |

---

## 📁 Project structure

```text
azure-vision-webapp/
├── app.py
├── compose.yaml
├── Dockerfile
├── requirements.txt
├── .env.example
├── services/
│   ├── azure_vision.py
│   ├── custom_vision.py
│   ├── face_service.py
│   └── ocr_service.py
├── static/
└── templates/
```

---

## ✅ Prerequisites

Before running the app, make sure you have:

- **Python 3.11** recommended
- **Docker Desktop** (optional, for container run)
- An **Azure AI Services / Vision** resource for image analysis and OCR
- Published **Custom Vision** models for classification and object detection
- A **Face API** resource, or reuse the Azure AI Services endpoint/key fallback

---

## 🚀 Run locally

1. Open a terminal in `azure-vision-webapp`.
2. Copy the environment template:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Fill in the values in `.env`.
4. Create and activate a virtual environment if needed:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

5. Install dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

6. Start the app:

   ```powershell
   python app.py
   ```

7. Open:

   ```text
   http://127.0.0.1:5000
   ```

---

## 🐳 Run with Docker

```powershell
docker compose up --build
```

Then open `http://127.0.0.1:5000`.

To stop the container:

```powershell
docker compose down
```

---

## ⚙️ Environment variables

Create a `.env` file from `.env.example` and provide the required Azure values.

| Variable | Required for | Notes |
| --- | --- | --- |
| `AI_SERVICE_ENDPOINT` | Image analysis, OCR | Azure AI Services endpoint |
| `AI_SERVICE_KEY` | Image analysis, OCR | Azure AI Services key |
| `CLASSIFICATION_PREDICTION_ENDPOINT` | Classification | Custom Vision prediction endpoint |
| `CLASSIFICATION_PREDICTION_KEY` | Classification | Prediction key |
| `CLASSIFICATION_PROJECT_ID` | Classification | Project GUID |
| `CLASSIFICATION_MODEL_NAME` | Classification | Published iteration name |
| `OBJECT_DETECTION_PREDICTION_ENDPOINT` | Object detection | Custom Vision prediction endpoint |
| `OBJECT_DETECTION_PREDICTION_KEY` | Object detection | Prediction key |
| `OBJECT_DETECTION_PROJECT_ID` | Object detection | Project GUID |
| `OBJECT_DETECTION_MODEL_NAME` | Object detection | Published iteration name |
| `FACE_API_ENDPOINT` | Face detection | Optional if you want a separate Face resource |
| `FACE_API_KEY` | Face detection | Falls back to `AI_SERVICE_KEY` if omitted |

> If `FACE_API_ENDPOINT` and `FACE_API_KEY` are left empty, the app falls back to `AI_SERVICE_ENDPOINT` and `AI_SERVICE_KEY`.

---

## 🔌 API endpoints

All responses are JSON and follow the pattern:

```json
{
  "ok": true,
  "result": {}
}
```

Available routes:

- `GET /` — frontend page
- `GET /api/health` — readiness check
- `POST /api/analyze-image` — image captioning, tags, objects, people
- `POST /api/classify-image` — Custom Vision classification
- `POST /api/detect-objects` — Custom Vision object detection
- `POST /api/detect-faces` — Face API detection
- `POST /api/read-text` — OCR / Read text


---

## 🛠️ Troubleshooting

### Custom Vision returns `Invalid iteration`
Make sure `CLASSIFICATION_MODEL_NAME` or `OBJECT_DETECTION_MODEL_NAME` matches the **published iteration name** in Azure exactly.

### The app opens, but Azure requests fail
Check:

- endpoint URLs are correct
- keys are valid
- project IDs belong to the right resource
- the model has been published
- Docker has been restarted after editing `.env`

### Reload Docker after config changes

```powershell
docker compose down
docker compose up --build
```

---

## 📌 Notes

- This app is intended as a practical wrapper around the Azure Vision lab exercises.
- The `Data/` folder contains sample assets for testing different scenarios.
- Keep secrets in `.env` only and never commit real keys to source control.

## Acknowledgment

This project is based on and inspired by the documentation of Azure AI Vision from Microsoft.
