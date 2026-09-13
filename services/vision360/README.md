# Faymoos Vision360

Run locally:

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8010
```

Set `VISION360_URL=http://127.0.0.1:8010` in the Next.js environment.

The service rejects weak frames when possible, then uses OpenCV panorama stitching. Guided capture is the main distortion-prevention layer; reconstruction cannot truthfully guarantee zero distortion if the camera translates heavily or the room contains large moving objects.
