# Resident wellbeing — next month (Pipeline 1)

**Notebook:** `ml-pipelines/resident_wellbeing_next_month.ipynb`  
**Domain:** Case management — flag residents who may have **lower composite wellbeing next month** so staff can prioritize support.  
**Target:** Mean of `general_health_score`, `sleep_quality_score`, `nutrition_score`, and `energy_level_score` in month *m*+1 (from `health_wellbeing_records`), predicted from month *m* features (no future health rows).

This file is a **short compliance map** for graders and teammates. The notebook remains the source of truth for code, metrics, and figures.

---

## Alignment with `docs/455_instructions.md` (ML deliverable)

| Required notebook section (455) | Where it lives |
| :--- | :--- |
| 1. Problem framing | `## 1. Problem Framing` (+ explicit business question and predictive vs explanatory intent) |
| 2. Data acquisition, preparation & exploration | `## 2. Data Acquisition, Preparation & Exploration` + merges, EDA, key feature definitions |
| 3. Modeling & feature selection | `## 3. Modeling & Feature Selection` — sklearn `Pipeline` / `ColumnTransformer`; RF (tuned) + linear regression; `feature_cols` documented |
| 4. Evaluation & interpretation | `## 4. Evaluation & Interpretation` — time-based split, grouped CV, MAE / RMSE / R², business readout, fairness/monitoring note |
| 5. Causal and relationship analysis | `## 5. Causal and Relationship Analysis` — limits on causal claims; coefficients vs importances |
| 6. Deployment notes | `## 6. Deployment Notes` — integration checklist, action playbook, synthesis |

**455-specific expectations met (high level):**

- **Both predictive and explanatory modeling:** Random forest (prediction) and linear regression (interpretation), with explicit separation in the modeling map and synthesis.
- **Reproducible preparation:** Imputation, scaling, and encoding inside sklearn pipelines (not one-off ad hoc steps only).
- **Proper validation:** Time-ordered holdout and group-aware CV by resident where applicable; timeline leakage avoided for the target.
- **Business interpretation:** Metric cells paired with plain-language “what this means” text; error tradeoffs discussed for regression context.
- **Deployment:** Notes for artifact, API shape, UI use, plus an **Action Playbook** that maps score bands to actions and monitoring KPIs.
- **Web app:** Final integration is a **team** responsibility; the notebook documents how the model should surface in the app and what to log for audits.

**Optional / partial relative to strict wording:**

- **“Causal model” (455 wording):** The notebook uses **explanatory** linear regression and explicitly **does not** claim causation from observational data — consistent with the instructions’ warning about conflating prediction and explanation.
- **Fairness:** A monitoring/fairness subsection is present; deep subgroup fairness analysis is not required unless the course asks for expansion.
- **Feature selection (Ch. 16):** Justified feature set and importance/coefficient discussion; no separate automated selector (e.g., RFE) unless you add one later.

---

## Alignment with `.cursorrules`

| Rule | Status |
| :--- | :--- |
| Dual model: explanatory + predictive | Met (linear + tuned random forest) |
| Pipelines / `ColumnTransformer` | Met |
| Plain language, causality guardrails | Met in markdown and prints |
| Six sections with **exact** headings | Met (`## 1.` … `## 6.`) |
| **Predictive and Explanatory Modeling Map** | Present as a **subsection** under Problem Framing (see notebook) |
| **Business question** | Explicit `### Business question` in Section 1 |
| Feature glossary for engineered fields | Met (`### Key feature definitions` and related tables) |
| **Action Playbook** in Section 6 after deployment mechanics, before synthesis | Met (playbook + KPI glossary, then synthesis) |
| Playbook columns (tier, rule/band, action, channel/owner, KPI) | Met in playbook table + glossary for KPI phrases |

---

## Data layout (team repo)

- **`data/`** at **project root** (sibling of `ml-pipelines/`), or **`./data`** next to the notebook if you run Jupyter from that folder only.
- The first code cell resolves `DATA_DIR` from `./data` or `../data` relative to the kernel working directory.

---

## Related planning docs

- `docs/pipeline_plan.md` — Pipeline 1 (Predictive + Explanatory)  
- `docs/girls_progress.md` — Strategy notes; composite score definition matches the **mean** of the four wellbeing subscores used in the notebook.
