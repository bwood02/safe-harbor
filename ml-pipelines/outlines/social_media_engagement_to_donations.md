# Social Media Engagement to Donation Conversion

## Business question
Does stronger social media engagement in month `m` correlate with higher donations in month `m+1`?

## Why this matters
Lighthouse Sanctuary relies on social media but has limited marketing capacity. This pipeline helps leadership decide what posting patterns are most associated with stronger next-month fundraising results and supports practical questions (content, platform, timing, cadence).

## Alignment with course standards

This pipeline is designed to satisfy `docs/455_instructions.md` and `.cursorrules`:

| Expectation | How this pipeline addresses it |
| :--- | :--- |
| Six notebook sections (Problem Framing through Deployment Notes) | Yes — same order and headings as required. |
| Prediction vs explanation | **Primary lens:** explanatory (linear-style readout). **Comparison:** predictive (Random Forest). `Predictive and Explanatory Modeling Map` near the top. |
| Reproducible prep (Ch. 7) | `ColumnTransformer` + `Pipeline` for impute/scale/encode + model. |
| Exploration | Charts and monthly engagement vs next-month donations; platform views; playbook tables from post-level aggregates. |
| Evaluation & business interpretation | Chronological holdout; MAE, RMSE, R²; plain-language readouts and error tradeoffs (over- vs under-forecasting). |
| Feature selection (Ch. 16) | Full feature set for main linear/RF models; reduced **core** feature set for Ridge + walk-forward reliability checks; playbook uses theory-driven KPIs. |
| Causal/relationship honesty | Section 5 and limitations stress association, not causation. |
| Actionability / thresholds | Reliability block picks best holdout model by RMSE; **Action Playbook** maps KPIs to weekly-style guidance (in notebook Section 6). |
| Synthesis | Section 6 includes predictive vs explanatory synthesis. |
| Deployment (Ch. 17) | Section 6 describes intended monthly run, dashboard card, and model versioning. **App wiring** (API/UI) is left to the team’s deployment sprint when all pipelines are integrated. |

## Data used
- `data/social_media_posts.csv`
- `data/donations.csv`

## Target definition
- **Primary target:** `y_next_monetary_amount` = next-month total of `donations.amount` (monetary cash).
- **Sensitivity target:** `y_next_estimated_value` = next-month total of `donations.estimated_value` (all donation types, estimated value).

## Time alignment
- Features are aggregated from month `m` social activity.
- Target is donation outcome in month `m+1`.
- Last feature month is excluded if no next-month donation target is available.

## Modeling approach
- **Explanatory model (primary lens):** Linear Regression (full features) for coefficient-style readout; **Ridge** on a small core feature set for more stable directional signals.
- **Predictive comparison model:** Random Forest Regressor.
- **Validation:** chronological holdout (no random shuffle for main comparison); naive baselines (last month, train mean); walk-forward RMSE check on Ridge; optional log-target Ridge check.
- **Reproducibility:** sklearn `ColumnTransformer` + `Pipeline`.

## Leakage safeguards
- No month `m+1` donation fields are used as features.
- Same-month donation totals used only as targets or prior-month controls where documented; playbook conversion metrics intentionally use post-level `donation_referrals` / `estimated_donation_value_php` for **operational** content effectiveness (not mixed into the month-ahead donation target model without clear separation in the notebook).
- Preprocessing is fit inside `Pipeline` on training data only for each split.

## Evaluation and business interpretation
- Metrics: MAE, RMSE, R² (regression-appropriate; not classification FP/FN).
- Operational meaning:
  - MAE: average pesos wrong on next-month forecast.
  - RMSE: penalizes large misses.
- Tradeoffs: overestimating donations can distort budget planning; underestimating can mean missed outreach.

## Practical decision implications
- Use explanatory outputs (coefficients / Ridge ranking) for **directional** strategy discussion.
- Use the model with best **validated** holdout performance for a simple next-month planning number.
- Use the **Action Playbook** (in the notebook) for posting priorities: platforms, content mix, time buckets, and cadence bands, prioritizing referral/value KPIs over likes-only vanity.

## Platform-level context
The notebook includes platform-month engagement and regression-line diagnostics (with per-platform R²) plus ranked playbook tables.

## Limitations
- Observational data supports **association**, not causal proof.
- Organization-month sample is modest; weak aggregate month-to-month linkage does not mean social media is unimportant—confounders and lag structures can hide effects.
- External factors (campaigns, seasonality, offline fundraising) can drive donations independently of social metrics.

## Deployment notes (intended)
- **Operational:** Run monthly after month `m` social metrics close; score features; publish forecast for month `m+1` plus playbook highlights.
- **Product (when integrated):** Lightweight dashboard card—expected donations, validation error note, top levers; optional API batch scoring. Document model version, training window, and chosen forecast model in repo `README` or `docs/`.
- **Status:** Notebook and strategy doc are complete; **web app integration** should match team schedule for deploying all pipelines together.

## Notebook path
`ml-pipelines/social_media_engagement_to_donations.ipynb`
