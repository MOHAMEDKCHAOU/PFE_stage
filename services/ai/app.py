from __future__ import annotations
import json, os
from pathlib import Path
import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

ART = Path(os.environ.get("FAYMOOS_AI_ARTIFACTS", "/app/ai/artifacts"))
app = FastAPI(title="Faymoos AI Intent Service", version="1.0.0")

class IntentRequest(BaseModel):
    text: str

class RetrievalRequest(BaseModel):
    query: str
    items: list[str]
    top_k: int = 5

_encoder = _clf = _labels = None
_meta = None

def load_artifacts():
    global _encoder, _clf, _labels, _meta
    if _encoder is not None:
        return
    meta_path = ART / "intent_meta.json"
    if not meta_path.exists():
        raise RuntimeError("AI artifacts not found. Run ai/notebooks/Faymoos_Premium_AI_Lab.ipynb first.")
    _meta = json.loads(meta_path.read_text(encoding="utf-8"))
    _encoder = SentenceTransformer(_meta["encoder"])
    _clf = joblib.load(ART / "intent_classifier.joblib")
    _labels = joblib.load(ART / "intent_labels.joblib")

@app.get("/health")
def health():
    ready = (ART / "intent_meta.json").exists()
    return {"ok": True, "artifacts_ready": ready}

@app.post("/intent")
def intent(req: IntentRequest):
    load_artifacts()
    prefix = _meta.get("prefix", "")
    x = _encoder.encode([prefix + req.text], normalize_embeddings=True)
    proba = _clf.predict_proba(x)[0]
    idx = int(np.argmax(proba))
    confidence = float(proba[idx])
    threshold = float(_meta.get("oos_threshold", 0.55))
    if confidence < threshold:
        return {"intent": "other", "confidence": confidence, "rejected": True}
    return {"intent": str(_labels.inverse_transform([idx])[0]), "confidence": confidence, "rejected": False}

@app.post("/retrieve")
def retrieve(req: RetrievalRequest):
    load_artifacts()
    prefix = _meta.get("prefix", "")
    if not req.items:
        return {"items": []}
    q = _encoder.encode([prefix + req.query], normalize_embeddings=True)[0]
    x = _encoder.encode([prefix + item for item in req.items], normalize_embeddings=True)
    scores = x @ q
    order = np.argsort(-scores)[: max(1, min(req.top_k, 20))]
    return {"items": [{"text": req.items[int(i)], "score": float(scores[int(i)])} for i in order]}
