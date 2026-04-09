# Trained model artifacts (`*.joblib`)

- **`donor_churn_rf.joblib`** — train with `python scripts/train_donor_churn.py` from repo root (requires `data/` CSVs).
- **`resident_wellbeing_rf.joblib`** — dict with `pipeline` + `feature_cols`; train with `python scripts/train_resident_wellbeing.py`.
- Other pipelines: add `*_rf.joblib` here when training scripts exist; FastAPI loads them if present.

Large binaries may be gitignored; attach to releases or regenerate locally for demos.
