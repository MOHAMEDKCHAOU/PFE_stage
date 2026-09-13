# Offline bootstrap sanity check

This packaging environment had scikit-learn available but did not have the external Hugging Face datasets / sentence-transformers packages or model weights, so the premium transformer notebook could not be executed here without network access.

A deliberately simple **word + character TF-IDF + logistic regression** sanity baseline was run locally on the included 144-row curated bootstrap set using 6-fold stratified cross-validation.

- Mean macro-F1: **0.3612**
- Fold standard deviation: **0.0708**
- Cross-language stress test (train on two languages, test on the third):
  - English macro-F1: **0.4771**
  - French macro-F1: **0.5850**
  - Arabic macro-F1: **0.0278**

These numbers are not a Faymoos production KPI. They demonstrate exactly why a cheap bag-of-words model is not acceptable for the multilingual product, especially for Arabic. The included Colab notebook therefore benchmarks multilingual sentence encoders (`paraphrase-multilingual-mpnet-base-v2`, `multilingual-e5-base`, optional `bge-m3`) and selects by held-out macro-F1 plus OOS behaviour.

Do not replace this file with an invented "99% accuracy" screenshot. The production model should only be promoted after running the notebook on the real external candidates and a locked Faymoos test set.
