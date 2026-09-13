# Faymoos AI dataset registry

This registry separates **public research candidates** from **first-party production data**. It is intentionally not a claim that one Kaggle/Hugging Face dataset makes a generative assistant "accurate". Faymoos uses different evaluation methods for intent, retrieval, conversion ranking and generation.

> Availability, dataset cards and commercial-use licenses must be re-checked before a production release. The build environment used for this package had no live web search, so these entries are established dataset/model candidates rather than freshly verified links.

## Public candidates

| Candidate | Common hub identifier / project | Use in Faymoos | What it does *not* solve |
|---|---|---|---|
| Amazon MASSIVE | `AmazonScience/massive` | Multilingual intent representation and robustness | Faymoos-specific conversion labels |
| CLINC150 / OOS | commonly distributed as `clinc_oos` | Out-of-scope intent rejection | Creator-specific intent phrasing |
| GoEmotions | `google-research-datasets/go_emotions` | Optional tone/emotion research for message triage | Business intent or CTA ranking |
| ADE20K | MIT Scene Parsing / ADE20K | Object/scene segmentation research for Smart Space hotspot suggestions | Panorama reconstruction geometry |
| SUN RGB-D | SUN RGB-D | Indoor RGB-D object/scene research | General phone panorama reconstruction |

## First-party datasets that matter most

### `faymoos_intents.csv`
Bootstrap multilingual intent set included in this repository. It contains English, French and Arabic examples for eight product intents. It is a **bootstrap training set**, not the final benchmark. Replace/augment it with anonymized real visitor queries after consent and privacy review.

### `faymoos_events.csv`
Not populated with fake conversion data. Production should export privacy-safe, consented interaction rows such as:

```text
visitor_segment,identity_type,experience_type,branch,cta_type,device,hour_bucket,proof_count,steps,converted
```

The CTA ranker must be trained on real events using time-based or group-based holdout. Synthetic conversions would give a lovely score and absolutely no business value.

### Retrieval relevance judgements
Create a small human-labelled file of:

```text
query,item_id,relevance
```

for creator projects/testimonials. Evaluate Recall@K and nDCG before turning semantic recommendations on by default.

## Recommended model candidates to benchmark

For multilingual intent/retrieval, the notebook compares or can compare:

- `sentence-transformers/paraphrase-multilingual-mpnet-base-v2`
- `intfloat/multilingual-e5-base`
- optional heavier model: `BAAI/bge-m3`

Do not select by model reputation. Select by held-out Faymoos macro-F1, OOS rejection, latency, memory and multilingual parity.

## Production quality gates

- Intent: macro-F1, per-class recall, confusion matrix, multilingual parity, OOS false-accept rate.
- Retrieval: Recall@K and nDCG on human judgements.
- CTA ranking: PR-AUC, calibration, then online A/B uplift. Never "accuracy" alone.
- Generated copy: factuality/grounding, human preference, safety checks, and downstream CTA performance.
- Smart Space vision: reconstruction completion rate, seam/artifact rate, rescan rate and user-rated fidelity.
