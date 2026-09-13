# Faymoos AI service

Run the Colab/notebook training pipeline first so `ai/artifacts/` contains the selected encoder metadata and classifier artifacts. The service then exposes `/intent` and `/retrieve` for multilingual visitor intent and grounded proof retrieval.

It deliberately refuses low-confidence intents instead of forcing every visitor message into a business category.
