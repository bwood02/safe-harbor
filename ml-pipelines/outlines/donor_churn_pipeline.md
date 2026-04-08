# Strategy: Donor Retention & Churn Risk
**Goal:** Reduce donor drop-off through targeted re-engagement.

## 1. Feature Engineering (Supporter Activity Signals)
Build a supporter-month feature table from `supporters` + `donations`:
- **Recency/Frequency/Value:** `days_since_last_donation`, `events_3m/6m/12m`, `value_3m/6m/12m`.
- **Campaign behavior:** `campaign_events_3m/6m/12m`.
- **Trend features:** `events_trend_3m_vs_prev3m`, `value_trend_3m_vs_prev3m`.
- **Seasonality features:** `month_of_year`, `quarter_of_year`, `gave_same_month_last_year`, `seasonal_supporter_flag`.

## 2. Defining Churn (The Target)
Compare inactivity windows and select the best operational target:
- `churn_90d = 1` if no donation activity in the next 90 days.
- `churn_180d = 1` if no donation activity in the next 180 days.
- Choose horizon using chronological holdout performance (PR-AUC primary) and campaign usefulness.

## 3. Modeling Lenses (Predictive + Explanatory)
- **Predictive model:** Random Forest classifier for ranking supporters by churn risk.
- **Explanatory model:** Logistic Regression for interpretable odds-ratio relationships.
- **Validation:** time-aware split (no random shuffle), with imbalance-aware metrics (PR-AUC, recall, precision, F1, ROC-AUC, accuracy).

## 4. Business Application
Output a **Donor Re-engagement Queue** with risk tiers:
- **High risk:** immediate personalized outreach.
- **Medium risk:** lighter-touch campaign sequence.
- **Low risk:** monitor.
Threshold is tuned to outreach capacity so the model supports real fundraising decisions.
