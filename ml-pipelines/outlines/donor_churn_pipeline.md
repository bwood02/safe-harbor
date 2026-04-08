# Strategy: Donor Retention & Churn Risk

**Goal:** Reduce donor drop-off through targeted re-engagement.

**Notebook:** `ml-pipelines/donor_churn_pipeline.ipynb`

---

## Alignment checklist (course + repo rules)

This pipeline is written to satisfy `docs/455_instructions.md` and `.cursorrules`:

| Requirement | How this pipeline addresses it |
| :--- | :--- |
| Six notebook sections (exact headings) | §1 Problem Framing … §6 Deployment Notes |
| Problem framing: who cares + predictive/explanatory | Fundraising audience; dual lens (RF + logistic) with textbook-style roles |
| Data prep & exploration | Loads `supporters` + `donations`; missingness, distributions; joins explained in notebook |
| Reproducible pipelines | `ColumnTransformer` + `Pipeline` for both models |
| Dual model (explanatory + predictive) | Logistic Regression (interpret) + Random Forest (rank / predict) |
| Evaluation & interpretation | Chronological holdout; PR-AUC, ROC-AUC, precision, recall, F1, accuracy; FP/FN in fundraising terms |
| Causal / relationship analysis | Odds ratios + limitations; correlation ≠ causation |
| Deployment | API/module paths, artifact name, synthesis; **Donor Action Playbook** table in §6 |
| Notebook style | Plain language, feature glossary, `Predictive and Explanatory Modeling Map` |

---

## 1. Feature engineering (supporter activity signals)

Build a supporter-month feature table from `supporters` + `donations`:

- **Recency / frequency / value:** `days_since_last_donation`, `events_3m/6m/12m`, `value_3m/6m/12m`.
- **Campaign behavior:** `campaign_events_3m/6m/12m`.
- **Trend features:** `events_trend_3m_vs_prev3m`, `value_trend_3m_vs_prev3m`.
- **Seasonality:** `month_of_year`, `quarter_of_year`, `gave_same_month_last_year`, `seasonal_supporter_flag`, `active_month_concentration`.

Definitions live in the notebook **Feature Glossary**.

---

## 2. Defining churn (the target)

- `churn_90d = 1` if no donation activity in the next 90 days.
- `churn_180d = 1` if no donation activity in the next 180 days.

Horizon and model are chosen using chronological holdout (PR-AUC primary). A **sensitivity check** compares “any donation” labels to **monetary-only** labels so the team can align the target with campaign goals.

---

## 3. Modeling lenses (predictive + explanatory)

- **Predictive:** Random Forest classifier — ranking, thresholds, campaign queue.
- **Explanatory:** Logistic Regression — odds ratios and directional associations (not causal proof).
- **Validation:** Time-aware split (no random shuffle). **Imbalance:** `class_weight='balanced'` and threshold tuning.

*Note:* Random Forest hyperparameters are fixed defaults suitable for the class dataset; optional future work is `RandomizedSearchCV` on time-based folds if the team wants heavier tuning.

---

## 4. Business application & Action Playbook

Output a **Donor Re-engagement Queue** with risk tiers driven by the recommended probability threshold (capacity-aware).

Section 6 of the notebook includes a **Donor Action Playbook** table: tier, score rule, team action, channel, and KPI to monitor (e.g. re-donation rate), plus a short operating rule for monthly capacity.

---

## 5. Deployment sketch

- Artifact: e.g. `models/donor_churn_model.joblib`
- Scoring module: e.g. `backend/app/ml/donor_churn.py`
- API: e.g. `POST /api/donors/churn-score` → probability + tier + playbook-aligned action hint

Track model version, training window, and chosen threshold in app logs or team docs.
