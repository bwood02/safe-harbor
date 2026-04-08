# 455 Project: Data Pipeline Roadmap

This document outlines six machine learning pipelines for Lighthouse Sanctuary, covering Case Management, Donor Relations, and Marketing Growth.

---

## 1. Case Management Pipeline (The Mission)

### Pipeline 1: Resident composite wellbeing — next month (Predictive + Explanatory) (`resident_wellbeing_next_month.ipynb`)
- **Notebook:** `ml-pipelines/girls_wellbeing_predictive.ipynb`
- **Target (Y):** **Composite wellbeing** for month *m*+1: the **simple mean** of `general_health_score`, `sleep_quality_score`, `nutrition_score`, and `energy_level_score` in `health_wellbeing_records` (each ~1–5), not general health alone.
- **Predictive track:** Random forest (tuned) for out-of-sample forecast of next month’s composite.
- **Explanatory track:** Linear regression on scaled features for directional associations with staff (conditional on lagged composite and case mix).
- **Purpose:** Operational triage (“who to watch next month”) plus a transparent linear readout for case discussions.

### Pipeline 2: Early Warning System — struggling next month (Predictive + Explanatory) (`early_warning_incident_next_month.ipynb`)
- **Notebook:** `ml-pipelines/early_warning_incident_next_month.ipynb`
- **Target (Y):** **Primary:** `y_next_struggling` — binary risk that **next month** shows struggle (composite of elevated incidents, high concern burden, and/or notable health decline vs baseline). **Sensitivity labels:** `y_next_elevated_incident` and a **high-severity-only** incident variant for stricter safety comparisons.
- **Predictive track:** Classifier **comparison** — **logistic regression**, **random forest**, and **gradient boosting**; **chronological** validation; **PR-AUC**-first selection, **Top‑K** / operating-threshold policy, rolling-style backtest readouts for monthly triage.
- **Explanatory track:** **Logistic regression** with **odds-ratio-style** interpretation of which resident-month signals are most associated with struggle (association, not proof of cause).
- **Purpose:** Help supervisors and social workers **prioritize support early** so residents do not fall through the cracks.

### Pipeline 3: Reintegration Readiness — forward classifier (Predictive + Explanatory) (`reintegration_readiness_next_month.ipynb`)
- **Notebook:** `ml-pipelines/reintegration_readiness_next_month.ipynb`
- **Target (Y):** **Primary:** `y_ready_within_3m` — 1 when a completion proxy is likely in months *m+1*–*m+3*. **Diagnostic:** `y_next_ready` — strict **next-month-only** readiness. Scoring cohort excludes residents already completed in month *m*.
- **Predictive track:** **Logistic regression** vs **random forest** with imbalance-aware setup; **validation PR-AUC** for model pick; **Top‑K** / recall-at‑K tables and tiered **review playbook** for capacity limits.
- **Explanatory track:** **Logistic regression** readout (**coefficients / odds ratios**) for factors associated with readiness — context for case conferences, not automatic discharge decisions.
- **Purpose:** **Review prioritization** across the reintegration lifecycle (who to conference first), aligned with case-management goal #2.

---

## 2. Donor Management Pipeline (The Fuel)

### Pipeline 4: Donor Churn Analysis (Predictive + Explanatory) (`donor_churn_pipeline.ipynb`)
- **Notebook:** `ml-pipelines/donor_churn_pipeline.ipynb`
- **Target (Y):** Binary **churn** on a supporter-month panel — compare **90-day** vs **180-day** forward windows of **no donation activity**; select the horizon by **chronological holdout** quality and fundraising usefulness (not a fixed 6-month rule in the notebook).
- **Predictive track:** **Random forest** classifier for **risk ranking** and campaign triage; threshold / tier guidance tuned to outreach capacity; **leakage-safe** features (recency, frequency, value, trends, channel/campaign mix).
- **Explanatory track:** **Logistic regression** with **odds-ratio** interpretation for which behaviors and profiles are associated with churn risk.
- **Purpose:** Trigger **thank-you** and **re-engagement** outreach earlier — donor retention under goal #1.

### Pipeline 5: High-Value Donor Profiles (Predictive + Explanatory) (`high_value_donor_profiles.ipynb`)
- **Notebook:** `ml-pipelines/high_value_donor_profiles.ipynb`
- **Target (Y):** **Dual labels (supporter × month-end snapshot *T*):** **Explanatory:** top **20% by rank** of **cumulative** donation value as-of *T* (`is_high_value_asof`). **Predictive:** top **20% by rank** of **forward 12-month** donation value in (*T*, *T*+12m] (`is_high_value_fwd`). (Rank-based cut avoids tie-at-zero label blowups; see notebook.)
- **Predictive track:** Classification to rank donors for outreach — **logistic regression** (baseline) vs **random forest**; **chronological** train/validation/test by snapshot month; **Recall@TopK** (e.g. top 15% list) as primary operating KPI; threshold sweep for probability cut vs team policy.
- **Explanatory track:** **Logistic regression** on the **as-of** high-value label for interpretable **coefficients / odds ratios** (association only; not causal proof).
- **Purpose:** Stewardship “profile” readout for strategy **plus** a monthly **priority queue** for who likely becomes high-value ahead — aligned with fundraising goal #1 (donors and fundraising).

---

## 3. Marketing & Growth Pipeline (The Bridge)

### Pipeline 6: Engagement to Donation Conversion (Predictive + Explanatory) (`social_media_engagement_to_donations.ipynb`)
- **Notebook:** `ml-pipelines/social_media_engagement_to_donations.ipynb`
- **Target (Y):** **Organization-month panel:** features from social activity in month *m* predict donation outcomes in **month *m+1*.** **Primary:** next-month total **monetary** giving — `sum(donations.amount)` by month. **Sensitivity:** next-month **`sum(estimated_value)`** to reflect broader support value.
- **Predictive track:** **Random forest regressor** for **out-of-sample** next-month totals; **chronological holdout**; **MAE / RMSE / R²** with business readouts for planning error.
- **Explanatory track:** **Linear regression** (standardized coefficients) for directional associations between engagement patterns and next-month donations; **observational** — not causal proof.
- **Purpose:** Inform **what/when/where to post** under thin marketing staffing and support an **ROI narrative** for leadership — goal #3 (social / outreach).