# Reintegration Readiness (Forward Classifier)

Stakeholder-facing summary aligned to `INTEX/ml-pipelines/reintegration_readiness_next_month.ipynb`.

---

## Business Question

Help teams decide **which residents to review first** for reintegration planning across safehouses, while reducing the chance that girls fall through the cracks.

This is a **review-priority tool**, not an automatic reintegration decision tool.

---

## Predictive vs explanatory (course framework)

This pipeline uses **both** modeling goals on purpose:

- **Predictive (Sections 3–4):** ranks resident-months for **who to review first** under limited staff time; choices emphasize held-out performance (e.g. PR-AUC, threshold and Top-K policy).
- **Explanatory (Sections 3 and 5):** a readable logistic view of **which patterns align with readiness** in the historical panel after controlling for other included factors—**association, not proof of cause.**

Strong predictions do **not** justify causal claims; coefficients support **case discussion and supervision**, not automatic discharge.

---

## Targets and time alignment

| Label | Meaning |
|:---|:---|
| **Primary (`y_ready_within_3m`)** | `1` if completion proxy falls in `m+1`, `m+2`, or `m+3` after month `m`. |
| **Diagnostic (`y_next_ready`)** | `1` only if completion proxy falls exactly in `m+1`. |

| Design choice | Detail |
|:---|:---|
| Unit | `resident_id x month` snapshot rows |
| Feature timing | Uses data from month `m` and earlier only |
| Scoring cohort | Residents not already completed at month `m` |
| Completion timing | `completion_month_proxy` = last observed activity month (limitation) |

---

## Leakage safeguards and feature scope

- Excludes direct outcome fields and labels from predictors (`reintegration_status`, `reintegration_type`, labels, `completion_month_proxy`, `next_month`, etc.).
- **Predictors in `X`:** rolling/cumulative history through month `m` (sessions, attendance/progress, health/sleep, incidents, tenure) plus eligible categoricals; **not** ids, raw dates, long narratives, or leakage fields. `resident_id` / `month` stay in the panel for joins and reporting, not as predictors.
- **Explanatory model:** deliberately **smaller** feature set so coefficients stay discussable in case conferences; see the notebook for the exact list.
- Uses chronological train/validation/test split by month.
- Uses pipeline preprocessing fit on training windows only.
- Excludes long narrative fields from modeling.

---

## Feature and metric glossary (plain language)

### Common engineered feature terms

| Term | Meaning |
|:---|:---|
| `*_3m_mean` | Average over the last 3 months through month `m` |
| `*_3m_sum` | Total over the last 3 months through month `m` |
| `*_cum_mean` | Running average from first month through month `m` |
| `*_cum_sum` | Running total from first month through month `m` |
| `attendance_rate_3m_mean` | Average attendance rate over last 3 months |
| `incident_count_3m_sum` | Total incidents over last 3 months |

### Model/evaluation terms

| Term | Meaning |
|:---|:---|
| `val_pr_auc` | Primary model-selection score on validation (best for rare positives) |
| Precision | Of flagged cases, share truly positive |
| Recall | Of true positives, share correctly flagged |
| Threshold / alerts | Chosen score cutoff and number of flagged cases |
| Top-K precision | True-positive share among top K highest scores |
| `recall_at_k` | Share of all true positives captured in top K |
| `coef` | Explanatory model coefficient (association direction/strength) |
| `odds_ratio` | Multiplicative change in odds (above 1 increases odds, below 1 decreases odds) |

---

## Modeling approach

- **Predictive model:** compares balanced logistic regression and class-weighted random forest; **selects** on validation PR-AUC. Hyperparameters use **moderate defaults** and model **comparison** rather than a large grid search, to keep the time-ordered validation easy to audit; the main operational tuning is the **score cutoff** and **Top-K** usage in Section 4.
- **Explanatory model:** logistic coefficients / odds ratios / p-values (when `statsmodels` is available) for **interpretable associations**—not causal proof.

---

## Evaluation and operating policy

The notebook now uses an explicit **middle-ground operating policy** for threshold selection to balance safety and workload:

- `min_precision = 0.12`
- `min_recall = 0.45`
- `min_alerts = 12`
- `max_alerts = 80`

Selection ranks feasible thresholds by recall-weighted utility (`f2`) then precision.

### Why this policy

- Protects against missed cases (recall floor).
- Avoids unmanageable false-positive volume (alert bounds + precision floor).
- Supports limited staffing capacity.

### False positives and false negatives (operational meaning)

- **False positive:** flagged for priority review but not “ready within three months” on this label. Cost is mainly **staff time** and the risk of **undue urgency** if a flag is treated as a decision—so outputs stay **review prompts** only.
- **False negative:** truly in-window readiness **not** flagged. Cost is **missed attention** when caseloads are heavy; the policy leans toward catching more true cases where the business rule allows.

### Fairness (Ch. 15)

No demographic or protected-class **subgroup** error analysis is included: the pipeline tables used here are not set up for that kind of audit. Monitoring focuses on overall operating metrics (precision/recall, Top-K, playbook KPIs). If appropriate stratification fields exist later under policy, subgroup review should precede high-stakes deployment.

### Reading sparse months

Some months may have `positives = 0`, so monthly precision/recall can be NaN/unstable. For decisions, rely most on:

1. pooled test row (`month = "(all test months)"`)
2. PR-AUC
3. Top-K and `recall_at_k` tables

---

## Deployment outputs now available in the notebook

Section 6 now includes a resident-level deployment table (test months) with:

- `resident_id`
- `month`
- `score`
- `tier` (`Tier A`, `Tier B`, `Tier C`)
- `review_priority_in_month` (1 = highest score in month)

And a month-level tier count table:

- `month`, `tier`, `cases`

This makes the playbook operationally usable for queue management.

---

## Relationship analysis (Section 5)

The notebook’s **Section 5** summarizes what the **explanatory** logistic implies: observational **associations** with readiness, hypotheses that make sense in case management (engagement, incidents, wellbeing proxies), and honest limits on **causation**. A code cell there repeats the **strongest signals** from the coefficient table (Section 3) in plain language for supervision—see the executed notebook for the current ranked list.

---

## Playbook tiers (summary)

Tiers use the **operating cutoff** from validation (`selected_threshold`) and a **watch band** width of `0.10` on the probability score:

- `tier_b_low = max(0, selected_threshold - 0.10)`, with a tiny adjustment in code if that would meet or exceed the cutoff (so Tier B is never an empty, contradictory band).

| Tier | Rule | Action intent |
|:---|:---|:---|
| Tier A | score >= `selected_threshold` | Immediate reintegration-readiness conference workflow |
| Tier B | `tier_b_low` <= score < `selected_threshold` | Targeted support + re-score next month |
| Tier C | score < `tier_b_low` | Continue plan and monitor |

Positive flags are **review prompts only**, not automatic reintegration decisions.

---

## Playbook KPI glossary

| KPI | Meaning |
|:---|:---|
| `queue_size` | Number of flagged cases |
| `review_completion_rate` | Share reviewed within SLA |
| `validated_ready_rate` | Share confirmed ready after review |
| `premature_transition_rate` | Share flagged but judged not ready |
| `time_to_reintegration_decision` | Time from flag to case decision |

Primary KPIs: `validated_ready_rate`, `review_completion_rate`  
Secondary KPIs: `premature_transition_rate`, `time_to_reintegration_decision`, `queue_size`

---

## Synthesis (predictive vs explanatory)

- **Predictive model** answers: who should be reviewed first right now?
- **Explanatory model** answers: which observed patterns are associated with readiness?
- They are strongest together: predictive ranking for action order, explanatory patterns for case discussion context.

---

## Monitoring cadence

| Cadence | What to check |
|:---|:---|
| Monthly | class balance, PR-AUC/recall at operating point, playbook KPIs |
| Quarterly | threshold review and model refresh decision |
| Early trigger | recalibrate sooner if performance or operational quality drops materially |

---

## Limitations

- Completion timing is proxy-based, not true timestamped readiness.
- Observational data supports association, not causation.
- Wider 3-month window improves signal density but still reflects historical completion patterns.

Use model outputs with professional case judgment and multidisciplinary review.

---

## Deployment / web application (course rubric)

`455_instructions.md` expects the scoring output to be **integrated into the team web application** (API, dashboard, or similar), not only described in a notebook. This document and Section 6 of the notebook cover **operating procedure and outputs**; once your app exposes scores (e.g. per resident-month columns or an API), add a short pointer in **Deployment Notes** to the concrete route, component path, or ticket so graders can trace **live integration**.

