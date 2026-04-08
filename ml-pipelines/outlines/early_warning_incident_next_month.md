# Early Warning System - Who Is Struggling Next Month?

This document summarizes Pipeline #2 for Lighthouse Sanctuary case management.

## How this notebook maps to course requirements (455 + `.cursorrules`)

| Expectation | How this pipeline addresses it |
| :--- | :--- |
| **Problem framing** | Clear business question, stakeholders, and **primary predictive goal** (next-month struggling triage) with **explanatory** companion for association readout—not causal inference. |
| **Dual modeling** | Predictive: benchmarked classifiers in sklearn `Pipeline` + `ColumnTransformer`. Explanatory: interpretable logistic-style coefficients/odds ratios in **Section 5**. |
| **Reproducible data prep** | Resident-month panel built in code with documented joins, glossary, and leakage guards. |
| **Exploration** | Section 2 summarizes panel coverage, label base rates, and **EDA visuals**: correlation of numeric month-`m` features with next-month struggling, a small heatmap for multicollinearity checks, and histogram overlaps for label separation; Sections 4–5 add evaluation visuals and interpretation. |
| **Evaluation** | Chronological split (with fallback when positive labels are sparse), imbalance-aware metrics (PR-AUC emphasis), threshold and Top-K staffing lens, rolling backtest, subgroup spot-check. |
| **Relationship analysis** | Section 5 discusses dominant associations with explicit limits: observational data, correlation ≠ causation. |
| **Deployment** | Section 6 describes monthly scoring workflow, playbook, KPIs, and integration patterns; see **Web application integration** below. |

## Objective
- Predict which residents are likely to be **struggling next month**.
- Help case managers prioritize who needs attention first.
- Keep a second severe-risk lens for leadership:
  - primary model: struggling-risk triage,
  - sensitivity checks: elevated and high-only incident risk.
- Pair prediction with explanation:
  - predictive model for ranking and triage,
  - explanatory logistic model for clear association insights.

**Predictive vs explanatory (textbook framing):** The **predictive** track is tuned for out-of-sample ranking, thresholds, and operations. The **explanatory** track sacrifices black-box accuracy where needed to communicate measurable associations and support program learning—without treating coefficients as proof of cause.

## Target and Time Alignment
- Unit of analysis: `resident_id x month_m`.
- Primary target: `y_next_struggling`.
  - Built as a practical next-month struggle flag (incident and/or concern/decline signals).
- Sensitivity targets:
  - `y_next_elevated_incident` (Medium+High),
  - `y_next_high_incident_sensitivity` (High only).
- Features are built from data available by end of month `m` only.
- Labels are shifted to month `m+1` to preserve true forecasting logic.
- Rows are limited to periods with observable next-month incident labels to avoid right-censoring.

## Leakage Safeguards
- No month `m+1` outcome data is used in features.
- No post-incident response fields are used as predictors.
- Restricted/free-text note fields are excluded.
- Time-aware split is chronological (not random).
- Split strategy prefers 60/20/20 by months, then falls back only when class coverage is too weak.
- Preprocessing is fit only inside sklearn pipelines on training data.

## Modeling and feature selection (brief)
- Multiple algorithms are compared for validation performance (see notebook Section 3).
- Features are chosen from domain tables with **time-safe** aggregations; target-related and leaky fields are excluded from `X`.
- Importance-style readouts appear in evaluation and explanatory sections rather than a single automated selector—consistent with “purposeful” feature use in Ch. 16.

## Data Inputs and Key Features
- `health_wellbeing_records`: current scores and month-over-month score changes.
- `process_recordings`: counseling intensity, concern/referral rates, emotional-state risk rates.
- `education_records`: attendance, progress, and academic stability signals.
- `home_visitations`: safety-concern and follow-up burden indicators.
- `intervention_plans`: monthly intervention touch counts (created/updated).
- `incident_reports`: month `m` incident history features (counts/flags) and month `m+1` target.
- `residents`: baseline case context.

## Modeling Plan (Dual-Model Requirement)
- Predictive benchmarking uses multiple classifiers with class-imbalance-aware setup.
- Explanatory model uses logistic regression and coefficient/odds-ratio interpretation.
- Reproducible implementation uses `ColumnTransformer` + `Pipeline`.
- Added severe-risk refinement:
  - monthly Top-K readouts (`Precision@K`, `Recall@K`),
  - two-stage workflow (struggling screen -> high-only refine).

## Evaluation Approach
- Prioritize class-imbalance-aware metrics:
  - PR-AUC (primary),
  - recall, precision, F1, ROC-AUC.
- Use confusion matrix at selected operating threshold.
- Choose threshold on validation data only.
- Tie threshold guidance to staffing capacity via monthly queue size.
- Use Top-K monthly metrics for real staffing scenarios.
- Interpret false negatives vs false positives in resident-safety terms.
- Use rolling time-based backtest summary as a reliability check (not only one holdout window).
- Add a lightweight subgroup check (for example by `safehouse_id`) to catch uneven recall across groups.

## Action Playbook Approach
- Section 6 of the notebook includes a compact playbook mapping:
  - rule/tier -> action -> owner -> KPI.
- Uses rendered DataFrame outputs (`display(...)`) for compact summaries.
- Uses text output (`to_string`) for long operating-rule narrative to avoid truncation.
- Includes `Playbook KPI glossary` immediately above playbook output cells.
- Primary KPI focus is safety operations:
  - `miss_rate` and `review_within_7_days` first,
  - `hit_rate` and `alert_volume` for workload monitoring.

## Deployment Notes
- Recommended monthly workflow:
  1. run feature build at month close,
  2. score active residents,
  3. apply threshold/risk tiers,
  4. route high-risk queue to case managers,
  5. monitor alert quality and recalibrate threshold quarterly.
- Integrate through scheduled scoring job and/or API endpoint with model artifact versioning and monitoring logs.
- **Web application integration (course rubric):** The notebook is the authoritative training and evaluation artifact. For production, the team should wire the **same feature schema and scoring path** into the INTEX app—for example, a read-only **API route** that returns `resident_id`, `month`, `risk_score`, and tier; or a **case-management dashboard** widget that lists the ranked queue for the current month. Store model version, threshold, and training cutoff with each batch so debugging and audits are possible.
- Operational interpretation:
  - model output is a prioritization tool for case review,
  - not an automatic decision engine.
- Executive operating recommendation:
  - if capacity is around 10 reviews/month, start with Top-10 risk scores, then expand to threshold-based alerts only if capacity remains.
- Synthesis for decision-makers:
  - predictive model supports monthly triage/ranking,
  - explanatory model supports communication of associated risk patterns and program improvement.
- Limitations and monitoring:
  - high-severity incidents remain rare, so high-only precision is expected to be lower,
  - monitor `miss_rate` and `review_within_7_days` as primary safety KPIs,
  - monitor `hit_rate`, `alert_volume`, and queue size as secondary workload KPIs,
  - recalibrate threshold quarterly or sooner when intake mix/workload shifts.
