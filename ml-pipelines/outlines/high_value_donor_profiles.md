# High-Value Donor Profiles (Dual Lens)

Stakeholder-facing summary aligned to `INTEX/ml-pipelines/high_value_donor_profiles.ipynb`.

---

## Business objective

Help fundraising teams answer two related questions:

1. **Explanatory:** Which donor characteristics are associated with being high-value today?
2. **Predictive:** Which donors should we prioritize now because they are most likely to become high-value over the next 12 months?

This is a **decision-support tool** for outreach prioritization, not a causal proof engine.

---

## Target definitions and time alignment

| Lens | Label |
|:---|:---|
| **Explanatory (as-of)** | `is_high_value_asof = 1` if donor is in the **top 20% by rank** of cumulative donation value at snapshot month `T` (ties broken in stable row order — avoids “everyone ties at zero” blowups) |
| **Predictive (forward)** | `is_high_value_fwd = 1` if donor is in the **top 20% by rank** of donation value in `(T, T+12m]` |

| Design choice | Detail |
|:---|:---|
| Unit | `supporter_id x snapshot_month` |
| Feature timing | Features use data from `T` and earlier only |
| Validation | Chronological split (no random shuffle) |
| Primary KPI | `Recall@TopK` with `TopK = 15%` outreach capacity |

---

## Data used

- `data/supporters.csv`
- `data/donations.csv`
- `data/donation_allocations.csv`

---

## Feature strategy (plain language)

Main feature families:

- **Profile context:** supporter type, relationship type, region, acquisition channel, tenure.
- **RFM behavior:** recency, donation count/frequency, and value over trailing 3/6/12 months.
- **Commitment signals:** recurring donation share.
- **Mix and preference:** donation-type mix and allocation concentration by program area.
- **Campaign behavior:** campaign response counts in trailing windows.

---

## Leakage safeguards

- Do not use any donation outcomes from `(T, T+12m]` as features.
- Build features as-of `T` only.
- Fit preprocessing and models on training months only.
- Use chronological splitting to preserve real deployment timing.
- Keep explanatory and predictive labels separate to avoid objective mixing.

---

## Modeling approach

- **Explanatory model:** Logistic Regression (interpretable associations via coefficients and odds ratios). **P-values:** sklearn does not provide them; the notebook treats coefficients and odds ratios as descriptive only (optional statsmodels for formal inference).
- **Predictive models compared:** Logistic Regression baseline and Random Forest classifier.
- **Model selection focus:** out-of-sample ranking quality for outreach utility.

---

## Feature selection (Ch. 16)

- **In scope:** Leakage-safe RFM-style behavior, mix and recurring signals, campaign and allocation concentration, supporter profile categories — chosen for cultivation relevance and timeline safety.
- **Out of scope on purpose:** free text, post-hoc social attribution fields, future-window outcomes, and predictors that add leakage or noise without a clear donor-action story.

---

## Label diagnostics (why plots can look odd)

- The notebook plots **monthly positive rate** (should stay near **~20%** with rank-based labels) and **share of rows with `forward_12m_value = 0`**.
- When most forward sums are zero, an old `>= 80th percentile` cutoff often equals zero and can label **far more than 20%** as positive. Rank-based top-20% fixes that.

---

## Evaluation and interpretation

Primary and secondary metrics:

- **Primary:** `Recall@TopK` (capacity-aware coverage of future high-value donors).
- **Secondary:** `Precision@TopK`, PR-AUC, ROC-AUC, precision, recall, F1.

**Threshold sweep readout:** **PR-AUC** and **Top-K** metrics depend only on **score ranking**, not on the probability cutoff. The notebook shows those once above the grid; the grid itself varies **Precision / Recall / F1** only.

**False positives vs false negatives (fundraising):** A false positive consumes stewardship capacity on a donor who does not become high-value; a false negative misses revenue from someone who would have. The primary **Recall@TopK** focus fits teams that must not miss likely major donors when outreach slots are capped.

Plain-language metric guide:

- `Recall@TopK`: Of all future high-value donors, how many are captured in the outreach list?
- `Precision@TopK`: Of the outreach list, how many truly become high-value?
- `PR-AUC`: Overall ranking quality when positives are less common.

---

## Deployment notes

Monthly operating workflow:

1. Refresh month-end data.
2. Re-score donor pool.
3. Contact top 15% first.
4. Track KPI movement and adjust threshold quarterly if capacity changes.

Output artifacts:

- ranked donor list with score and tier
- action playbook table
- KPI summary for review cadence

**Course rubric:** Wire these outputs into the INTEX **web application** (dashboard, API, or export job) wherever donor-facing tools live so end users see value beyond the notebook.

---

## Donor Action Playbook (summary)

| Tier | Rule | Action | Owner | KPI |
|:---|:---|:---|:---|:---|
| High Priority | Top ~10% scores | Personalized call + impact report + tailored ask | Donor Relations Lead | Recall@TopK, conversion lift |
| Watch | Next ~20% scores | Targeted stewardship email + follow-up | Fundraising Coordinator | Precision@TopK, response rate |
| Routine | Remaining donor pool | Standard nurture cadence and monitor trend | Automation + Team Oversight | Follow-through rate, upgrade rate |

---

## Playbook KPI glossary

| KPI | Meaning |
|:---|:---|
| `Recall@TopK` | Share of true future high-value donors captured in outreach list |
| `Precision@TopK` | Hit-rate inside outreach list |
| `conversion_lift` | Improvement vs business-as-usual outreach |
| `follow_through_rate` | Share of assigned actions completed on time |

Primary KPI: `Recall@TopK`  
Secondary KPIs: `Precision@TopK`, `conversion_lift`, `follow_through_rate`

---

## Synthesis (predictive vs explanatory)

- **Predictive model** helps decide **who to contact first** each month.
- **Explanatory model** helps explain **which donor patterns are associated** with high-value status.
- Use both together: predictive ranking for operations, explanatory signals for strategy and communication.

---

## Limitations

- Observational data supports association, not causal proof.
- Thresholds and rankings can drift with campaign mix and seasonality.
- External factors not captured in these tables can influence donor behavior.

Use model output with fundraising team judgment and periodic monitoring.

