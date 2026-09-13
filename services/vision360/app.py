from __future__ import annotations

import io
from typing import List

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response

app = FastAPI(title="Faymoos Vision360", version="1.0.0")


def decode_image(data: bytes) -> np.ndarray:
    array = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Invalid image")
    return image


def quality_score(image: np.ndarray) -> float:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    sharpness = min(float(cv2.Laplacian(gray, cv2.CV_64F).var()) / 500.0, 1.0)
    exposure = 1.0 - min(abs(float(gray.mean()) - 127.0) / 127.0, 1.0)
    return round(0.72 * sharpness + 0.28 * exposure, 4)


@app.get("/health")
def health():
    return {"ok": True, "service": "vision360"}


@app.post("/quality")
async def quality(file: UploadFile = File(...)):
    data = await file.read()
    try:
        image = decode_image(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"quality": quality_score(image), "width": int(image.shape[1]), "height": int(image.shape[0])}


@app.post("/stitch")
async def stitch(files: List[UploadFile] = File(...)):
    if not 6 <= len(files) <= 48:
        raise HTTPException(status_code=400, detail="Provide between 6 and 48 frames")

    scored: list[tuple[float, np.ndarray]] = []
    for file in files:
        data = await file.read()
        try:
            image = decode_image(data)
        except ValueError:
            continue
        scored.append((quality_score(image), image))

    # Keep low-quality frames out of the reconstruction when enough alternatives exist.
    if len(scored) >= 8:
        filtered = [image for score, image in scored if score >= 0.18]
        images = filtered if len(filtered) >= 6 else [image for _, image in scored]
    else:
        images = [image for _, image in scored]

    if len(images) < 6:
        raise HTTPException(status_code=422, detail="Not enough usable frames")

    # OpenCV's panorama stitcher performs feature matching, homography estimation,
    # seam finding and multi-band style blending. Guided capture reduces parallax
    # before this stage; no system can truthfully promise zero distortion for arbitrary motion.
    stitcher = cv2.Stitcher_create(cv2.Stitcher_PANORAMA)
    status, panorama = stitcher.stitch(images)
    if status != cv2.Stitcher_OK or panorama is None:
        raise HTTPException(status_code=422, detail=f"Panorama reconstruction failed (OpenCV status {status})")

    # Conservative cleanup: crop empty borders without inventing scene content.
    gray = cv2.cvtColor(panorama, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 1, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        x, y, w, h = cv2.boundingRect(max(contours, key=cv2.contourArea))
        panorama = panorama[y : y + h, x : x + w]

    ok, encoded = cv2.imencode(".jpg", panorama, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
    if not ok:
        raise HTTPException(status_code=500, detail="Could not encode panorama")
    return Response(content=encoded.tobytes(), media_type="image/jpeg")
