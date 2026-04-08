const formBindings = [
    {
        formId: "analyzeForm",
        endpoint: "/api/analyze-image",
        resultId: "analyzeResult",
        previewCanvasId: "analyzeCanvas",
        previewHintId: "analyzeHint",
    },
    {
        formId: "classifyForm",
        endpoint: "/api/classify-image",
        resultId: "classifyResult",
        previewCanvasId: "classifyCanvas",
        previewHintId: "classifyHint",
    },
    {
        formId: "detectObjectsForm",
        endpoint: "/api/detect-objects",
        resultId: "detectObjectsResult",
        previewCanvasId: "detectObjectsCanvas",
        previewHintId: "detectObjectsHint",
    },
    {
        formId: "detectFacesForm",
        endpoint: "/api/detect-faces",
        resultId: "detectFacesResult",
        previewCanvasId: "detectFacesCanvas",
        previewHintId: "detectFacesHint",
    },
    {
        formId: "ocrForm",
        endpoint: "/api/read-text",
        resultId: "ocrResult",
        previewCanvasId: "ocrCanvas",
        previewHintId: "ocrHint",
    },
];

function setResult(element, value) {
    element.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function setHtmlResult(element, html) {
    element.innerHTML = html;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatPercent(value) {
    return `${Number(value ?? 0).toFixed(1)}%`;
}

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Unable to load the selected image."));
        image.src = URL.createObjectURL(file);
    });
}

async function showOriginalImage(form, previewCanvas, previewHint, options = {}) {
    if (!previewCanvas) {
        return;
    }

    const fileInput = form.querySelector('input[type="file"]');
    const file = fileInput?.files?.[0];
    if (!file) {
        previewCanvas.hidden = true;
        if (previewHint) {
            previewHint.textContent = "Please choose an image file first.";
        }
        return;
    }

    const image = await loadImageFromFile(file);
    const ctx = previewCanvas.getContext("2d");
    const canvasWidth = image.naturalWidth || image.width;
    const canvasHeight = image.naturalHeight || image.height;

    previewCanvas.width = canvasWidth;
    previewCanvas.height = canvasHeight;
    previewCanvas.hidden = false;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);

    const fontSize = Math.max(16, Math.round(Math.min(canvasWidth, canvasHeight) / 24));
    const ribbonText = options.ribbonText ? String(options.ribbonText) : "";

    if (ribbonText) {
        const safeText = ribbonText.length > 42 ? `${ribbonText.slice(0, 42)}…` : ribbonText;
        const paddingX = 12;
        const paddingY = 8;
        const boxHeight = fontSize + paddingY * 1.5;
        const boxWidth = Math.min(canvasWidth - 24, ctx.measureText(safeText).width + paddingX * 2);

        ctx.fillStyle = options.ribbonColor || "#4cc2ff";
        ctx.globalAlpha = 0.9;
        ctx.fillRect(12, 12, boxWidth, boxHeight);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#06101d";
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textBaseline = "top";
        ctx.fillText(safeText, 12 + paddingX, 12 + 5);
    }

    if (previewHint) {
        previewHint.textContent = options.message || "Image preview ready.";
    }
}

async function drawImagePreview(form, previewCanvas, previewHint, items, options) {
    if (!previewCanvas) {
        return;
    }

    const fileInput = form.querySelector('input[type="file"]');
    const file = fileInput?.files?.[0];
    if (!file) {
        previewCanvas.hidden = true;
        if (previewHint) {
            previewHint.textContent = "Please choose an image file first.";
        }
        return;
    }

    const image = await loadImageFromFile(file);
    const ctx = previewCanvas.getContext("2d");
    const canvasWidth = image.naturalWidth || image.width;
    const canvasHeight = image.naturalHeight || image.height;

    previewCanvas.width = canvasWidth;
    previewCanvas.height = canvasHeight;
    previewCanvas.hidden = false;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);

    const lineWidth = Math.max(2, Math.round(Math.min(canvasWidth, canvasHeight) / 160));
    const fontSize = Math.max(14, Math.round(Math.min(canvasWidth, canvasHeight) / 24));

    ctx.lineWidth = lineWidth;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textBaseline = "top";

    if (previewHint) {
        previewHint.textContent = items.length ? options.successText : options.emptyText;
    }

    items.forEach((item) => {
        const box = options.getBox(item, canvasWidth, canvasHeight) || {};
        const left = Number(box.left ?? box.x ?? 0);
        const top = Number(box.top ?? box.y ?? 0);
        const width = Number(box.width ?? 0);
        const height = Number(box.height ?? 0);
        const strokeColor = options.getStrokeStyle ? options.getStrokeStyle(item) : options.strokeStyle;

        ctx.strokeStyle = strokeColor;
        ctx.strokeRect(left, top, width, height);

        const label = options.getLabel(item);
        const labelWidth = ctx.measureText(label).width + 12;
        const labelHeight = fontSize + 8;
        const labelTop = Math.max(0, top - labelHeight);

        ctx.fillStyle = strokeColor;
        ctx.fillRect(left, labelTop, labelWidth, labelHeight);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(label, left + 6, labelTop + 4);
    });
}

function renderAnalysisResult(result) {
    const tags = (result.tags || []).slice(0, 8);
    const details = (result.dense_captions || []).slice(0, 3);
    const summary = result.summary || {};

    return `
        <h3>Scene summary</h3>
        <div class="hero-result">${escapeHtml(result.caption || "No caption detected")}</div>
        <div class="subtle-text">${result.caption_confidence ? `Confidence: ${formatPercent(result.caption_confidence)}` : "Confidence not available"}</div>
        <div class="insight-list">
            <span class="insight-chip">Tags: ${summary.tag_count ?? tags.length}</span>
            <span class="insight-chip">Objects: ${summary.object_count ?? 0}</span>
            <span class="insight-chip">People: ${summary.people_count ?? 0}</span>
        </div>
        ${tags.length ? `
            <h4>Top tags</h4>
            <div class="chip-list">${tags.map((tag) => `<span class="insight-chip">${escapeHtml(tag.name)} ${formatPercent(tag.confidence)}</span>`).join("")}</div>
        ` : ""}
        ${details.length ? `
            <h4>More details</h4>
            <ul class="detail-list">${details.map((item) => `<li>${escapeHtml(item.text)} (${formatPercent(item.confidence)})</li>`).join("")}</ul>
        ` : ""}
    `;
}

function renderClassificationResult(result) {
    const top = result.top_prediction;
    const predictions = (result.predictions || []).slice(0, 5);

    return `
        <h3>Best match</h3>
        <div class="hero-result">${escapeHtml(top?.tag_name || "No label detected")}</div>
        <div class="subtle-text">${top ? `Confidence: ${formatPercent(top.probability)}` : "Try another image for a clearer result."}</div>
        ${predictions.length ? `
            <div class="score-list">
                ${predictions.map((item) => `
                    <div>
                        <div class="score-label">
                            <span>${escapeHtml(item.tag_name)}</span>
                            <strong>${formatPercent(item.probability)}</strong>
                        </div>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${Math.max(4, Number(item.probability ?? 0))}%;"></div>
                        </div>
                    </div>
                `).join("")}
            </div>
        ` : '<div class="subtle-text">No predictions were returned.</div>'}
    `;
}

function renderObjectDetectionResult(result) {
    const summaryPredictions = Array.from(
        (result.predictions || []).reduce((map, item) => {
            const tagName = item.tag_name || "Object";
            const probability = Number(item.probability ?? 0);
            const current = map.get(tagName);

            if (!current || probability > current.probability) {
                map.set(tagName, { tag_name: tagName, probability });
            }

            return map;
        }, new Map()).values(),
    ).sort((left, right) => right.probability - left.probability).slice(0, 5);

    const top = summaryPredictions[0];

    return `
        <h3>Detection summary</h3>
        <div class="hero-result">${escapeHtml(top?.tag_name || "No object detected")}</div>
        <div class="subtle-text">${top ? `Highest confidence: ${formatPercent(top.probability)}` : "Try another image for a clearer result."}</div>
        ${summaryPredictions.length ? `
            <div class="score-list">
                ${summaryPredictions.map((item) => `
                    <div>
                        <div class="score-label">
                            <span>${escapeHtml(item.tag_name)}</span>
                            <strong>${formatPercent(item.probability)}</strong>
                        </div>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${Math.max(4, Number(item.probability ?? 0))}%;"></div>
                        </div>
                    </div>
                `).join("")}
            </div>
        ` : '<div class="subtle-text">No high-confidence detections were returned.</div>'}
    `;
}

function renderOcrResult(result) {
    const lines = (result.lines || []).map((line) => line.text).filter(Boolean);

    return `
        <h3>Recognized text</h3>
        <div class="insight-list">
            <span class="insight-chip">Lines found: ${result.line_count ?? lines.length}</span>
        </div>
        <div class="ocr-text-box">${lines.length ? lines.map((line) => escapeHtml(line)).join("<br>") : "No readable text found."}</div>
    `;
}

async function renderAnalyzePreview(form, result, previewCanvas, previewHint) {
    const items = [
        ...(result.objects || []).map((item) => ({ ...item, kind: "object" })),
        ...(result.people || []).map((item) => ({ ...item, kind: "person", name: "Person" })),
    ].filter((item) => item.bounding_box);

    if (!items.length) {
        await showOriginalImage(form, previewCanvas, previewHint, {
            message: "The image is shown with the scene summary above.",
            ribbonText: result.caption || "Analysis complete",
            ribbonColor: "#10b981",
        });
        return;
    }

    await drawImagePreview(form, previewCanvas, previewHint, items, {
        strokeStyle: "#10b981",
        successText: "Objects and people are highlighted on the image.",
        emptyText: "The analyzed image preview is shown below.",
        getStrokeStyle: (item) => (item.kind === "person" ? "#4cc2ff" : "#10b981"),
        getBox: (item) => item.bounding_box,
        getLabel: (item) => `${item.name || "Object"} ${item.confidence ? formatPercent(item.confidence) : ""}`.trim(),
    });
}

async function renderClassificationPreview(form, result, previewCanvas, previewHint) {
    const top = result.top_prediction;
    await showOriginalImage(form, previewCanvas, previewHint, {
        message: "The uploaded image is shown with its best classification result.",
        ribbonText: top ? `${top.tag_name} • ${formatPercent(top.probability)}` : "Classification complete",
        ribbonColor: "#a78bfa",
    });
}

async function renderObjectDetectionPreview(form, result, previewCanvas, previewHint) {
    const predictions = (result.predictions || [])
        .filter((prediction) => (prediction.probability ?? 0) >= 50)
        .map((prediction) => ({
            ...prediction,
            bounding_box: {
                left: (prediction.bounding_box?.left || 0),
                top: (prediction.bounding_box?.top || 0),
                width: (prediction.bounding_box?.width || 0),
                height: (prediction.bounding_box?.height || 0),
            },
        }));

    await drawImagePreview(form, previewCanvas, previewHint, predictions, {
        strokeStyle: "#ff4d4f",
        successText: "The output image below shows detected objects with red boxes and labels.",
        emptyText: "No high-confidence objects were found, so the original image is shown.",
        getBox: (item, canvasWidth, canvasHeight) => ({
            left: (item.bounding_box?.left || 0) * canvasWidth,
            top: (item.bounding_box?.top || 0) * canvasHeight,
            width: (item.bounding_box?.width || 0) * canvasWidth,
            height: (item.bounding_box?.height || 0) * canvasHeight,
        }),
        getLabel: (item) => `${item.tag_name} ${Number(item.probability ?? 0).toFixed(1)}%`,
    });
}

async function renderFaceDetectionPreview(form, result, previewCanvas, previewHint) {
    const faces = result.faces || [];

    await drawImagePreview(form, previewCanvas, previewHint, faces, {
        strokeStyle: "#4cc2ff",
        successText: "Detected faces are outlined in blue with glasses information.",
        emptyText: "No faces were found, so the original image is shown.",
        getBox: (item) => ({
            left: item.face_rectangle?.left || 0,
            top: item.face_rectangle?.top || 0,
            width: item.face_rectangle?.width || 0,
            height: item.face_rectangle?.height || 0,
        }),
        getLabel: (item) => item.face_attributes?.glasses || "Face",
    });
}

async function renderOcrPreview(form, result, previewCanvas, previewHint) {
    const textLines = (result.lines || []).filter((line) => line.bounding_box);

    if (!textLines.length) {
        await showOriginalImage(form, previewCanvas, previewHint, {
            message: "The scanned image is shown below and the recognized text appears above.",
            ribbonText: `${result.line_count ?? 0} line(s) detected`,
            ribbonColor: "#f59e0b",
        });
        return;
    }

    await drawImagePreview(form, previewCanvas, previewHint, textLines, {
        strokeStyle: "#f59e0b",
        successText: "Detected text regions are highlighted in gold on the image.",
        emptyText: "The scanned image preview is shown below.",
        getBox: (item) => item.bounding_box,
        getLabel: (item) => {
            const text = item.text || "Text";
            return text.length > 22 ? `${text.slice(0, 22)}…` : text;
        },
    });
}

async function submitUploadForm(form, endpoint, resultElement, previewCanvas, previewHint) {
    const formData = new FormData(form);
    setResult(resultElement, "Working...");

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        if (!response.ok || !data.ok) {
            throw new Error(data.error || "Request failed.");
        }

        if (endpoint === "/api/analyze-image") {
            setHtmlResult(resultElement, renderAnalysisResult(data.result));
            await renderAnalyzePreview(form, data.result, previewCanvas, previewHint);
        } else if (endpoint === "/api/classify-image") {
            setHtmlResult(resultElement, renderClassificationResult(data.result));
            await renderClassificationPreview(form, data.result, previewCanvas, previewHint);
        } else if (endpoint === "/api/read-text") {
            setHtmlResult(resultElement, renderOcrResult(data.result));
            await renderOcrPreview(form, data.result, previewCanvas, previewHint);
        } else if (endpoint === "/api/detect-objects") {
            setHtmlResult(resultElement, renderObjectDetectionResult(data.result));
            await renderObjectDetectionPreview(form, data.result, previewCanvas, previewHint);
        } else if (endpoint === "/api/detect-faces") {
            const faceCount = data.result?.face_count ?? data.result?.faces?.length ?? 0;
            setResult(resultElement, `Detected ${faceCount} face(s). See the annotated image below.`);
            await renderFaceDetectionPreview(form, data.result, previewCanvas, previewHint);
        } else {
            setResult(resultElement, data.result);
        }
    } catch (error) {
        const friendlyError = endpoint === "/api/detect-objects"
            ? `Object detection failed: ${error.message}`
            : endpoint === "/api/detect-faces"
                ? `Face detection failed: ${error.message}`
                : endpoint === "/api/analyze-image"
                    ? `Image analysis failed: ${error.message}`
                    : endpoint === "/api/classify-image"
                        ? `Image classification failed: ${error.message}`
                        : endpoint === "/api/read-text"
                            ? `OCR failed: ${error.message}`
                            : `Request failed: ${error.message}`;

        setResult(resultElement, friendlyError);
        if (previewCanvas) {
            previewCanvas.hidden = true;
        }
        if (previewHint) {
            previewHint.textContent = "The preview could not be generated because the request failed.";
        }
    }
}

formBindings.forEach(({ formId, endpoint, resultId, previewCanvasId, previewHintId }) => {
    const form = document.getElementById(formId);
    const resultElement = document.getElementById(resultId);
    const previewCanvas = previewCanvasId ? document.getElementById(previewCanvasId) : null;
    const previewHint = previewHintId ? document.getElementById(previewHintId) : null;

    if (!form || !resultElement) {
        return;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        submitUploadForm(form, endpoint, resultElement, previewCanvas, previewHint);
    });
});

