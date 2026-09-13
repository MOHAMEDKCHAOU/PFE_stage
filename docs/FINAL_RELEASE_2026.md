# Faymoos Premium 2026 — final integrated release

This package merges the original Faymoos PFE application, the RBAC/security hardening, the simplified product architecture, CRM-lite leads, Premium AI lab/service, monetization plan and Smart 360 Space prototype.

## Creator information architecture

- Home
- My Presence
- Experiences
  - Guided Experiences (existing capsule engine)
  - 360 Smart Spaces
- Audience
  - Analytics
  - Leads
  - Inbox
  - Feedback
- Library
- Explore
- Settings

Role-specific areas remain separate: Studio, Moderation, Administration and Super Admin security.

## Smart 360

The default workflow is intentionally low-effort: create a Smart Space, open the rear camera, follow the moving target, let the browser capture useful frames automatically, and submit them to the `services/vision360` reconstruction service. The backend uses OpenCV panorama stitching and conservative border cleanup. This does not claim impossible zero-distortion reconstruction from arbitrary camera motion; the UX is designed to prevent the biggest source of failure, parallax, during capture.

## Premium AI

The repository contains a 144-row human-readable multilingual Faymoos bootstrap intent dataset (EN/FR/AR), a Colab/Jupyter evaluation notebook, public-dataset research candidates, model export steps, out-of-scope rejection, per-language metrics, semantic proof retrieval and a FastAPI inference service. The notebook must be run before the AI service can load exported artifacts.

Public dataset candidates must have their current availability and licensing checked before commercial training.

## Monetization hypothesis

- Free: €0
- Pro: €19/month
- Studio: €69/month
- Studio+: €179/month

Smart Scan and AI usage are deliberately limited by plan because they create real compute cost. Treat these numbers as launch hypotheses to validate with paying customers, not as immutable market truth.

## Run locally

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Run Vision360 separately:

```bash
cd services/vision360
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8010
```

For Premium AI, run `ai/notebooks/Faymoos_Premium_AI_Lab.ipynb`, place the exported artifacts in `ai/artifacts/`, then:

```bash
cd services/ai
pip install -r requirements.txt
uvicorn app:app --reload --port 8020
```

Or use `docker compose up --build` after training/exporting the AI artifacts.
