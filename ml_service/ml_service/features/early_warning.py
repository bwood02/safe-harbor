"""
Early warning (next-month struggle) — aligned with ml-pipelines/early_warning_incident_next_month.ipynb.
Target: y_next_struggling (binary).
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

TARGET = "y_next_struggling"
RANDOM_STATE = 42

LEAKAGE_EXCLUSIONS = {
    TARGET,
    "y_next_progressing",
    "y_next_elevated_incident",
    "y_next_high_incident_sensitivity",
    "resident_id",
    "month_m",
    "target_month",
    "month_index",
    "split",
}


def month_start(series: pd.Series) -> pd.Series:
    return pd.to_datetime(series, errors="coerce").dt.to_period("M").dt.to_timestamp()


def _boolish_mean(s: pd.Series) -> float:
    if s.dtype == bool or s.dtype == np.bool_:
        return float(s.astype(float).mean())
    if pd.api.types.is_numeric_dtype(s):
        return float(s.fillna(0).mean())
    return float((s.astype(str).str.lower().isin(["true", "1", "yes"])).mean())


def _build_inner(
    residents: pd.DataFrame,
    health: pd.DataFrame,
    process: pd.DataFrame,
    education: pd.DataFrame,
    visits: pd.DataFrame,
    plans: pd.DataFrame,
    incidents: pd.DataFrame,
) -> pd.DataFrame:
    for df, col in [
        (health, "record_date"),
        (process, "session_date"),
        (education, "record_date"),
        (visits, "visit_date"),
        (plans, "created_at"),
        (plans, "updated_at"),
        (incidents, "incident_date"),
    ]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")

    months = pd.concat(
        [
            month_start(health["record_date"]),
            month_start(process["session_date"]),
            month_start(education["record_date"]),
            month_start(visits["visit_date"]),
            month_start(plans["created_at"]),
            month_start(incidents["incident_date"]),
        ],
        axis=0,
    ).dropna()

    all_months = pd.date_range(months.min(), months.max(), freq="MS")
    panel = pd.MultiIndex.from_product(
        [residents["resident_id"].dropna().unique(), all_months],
        names=["resident_id", "month_m"],
    ).to_frame(index=False)

    panel["month_index"] = (panel["month_m"].dt.year * 12 + panel["month_m"].dt.month).astype(int)

    health_f = health.copy()
    health_f["month_m"] = month_start(health_f["record_date"])
    sleep_col = "sleep_score" if "sleep_score" in health_f.columns else "sleep_quality_score"
    energy_col = "energy_score" if "energy_score" in health_f.columns else "energy_level_score"

    health_monthly = (
        health_f.groupby(["resident_id", "month_m"], as_index=False)
        .agg(
            nutrition_score_m=("nutrition_score", "mean"),
            sleep_score_m=(sleep_col, "mean"),
            energy_score_m=(energy_col, "mean"),
            general_health_score_m=("general_health_score", "mean"),
            bmi_m=("bmi", "mean"),
            psych_checkup_m=("psychological_checkup_done", "max"),
            med_checkup_m=("medical_checkup_done", "max"),
            dental_checkup_m=("dental_checkup_done", "max"),
        )
        .sort_values(["resident_id", "month_m"])
    )

    for c in ["nutrition_score_m", "sleep_score_m", "energy_score_m", "general_health_score_m"]:
        health_monthly[f"delta_{c}"] = health_monthly.groupby("resident_id")[c].diff()

    panel = panel.merge(health_monthly, on=["resident_id", "month_m"], how="left")

    proc_f = process.copy()
    proc_f["month_m"] = month_start(proc_f["session_date"])
    risk_states = {"Anxious", "Sad", "Angry", "Withdrawn", "Distressed"}
    proc_f["start_risk_state"] = proc_f["emotional_state_observed"].isin(risk_states).astype(int)
    proc_f["end_risk_state"] = proc_f["emotional_state_end"].isin(risk_states).astype(int)

    proc_monthly = (
        proc_f.groupby(["resident_id", "month_m"], as_index=False)
        .agg(
            sessions_count_m=("recording_id", "count"),
            avg_session_duration_m=("session_duration_minutes", "mean"),
            concerns_rate_m=("concerns_flagged", lambda s: _boolish_mean(s)),
            progress_rate_m=("progress_noted", lambda s: _boolish_mean(s)),
            referral_rate_m=("referral_made", lambda s: _boolish_mean(s)),
            start_risk_state_rate_m=("start_risk_state", "mean"),
            end_risk_state_rate_m=("end_risk_state", "mean"),
        )
    )
    panel = panel.merge(proc_monthly, on=["resident_id", "month_m"], how="left")

    edu_f = education.copy()
    edu_f["month_m"] = month_start(edu_f["record_date"])
    if "attendance_status" in edu_f.columns:
        edu_f["is_absent"] = (edu_f["attendance_status"] == "Absent").astype(int)
        edu_f["is_late"] = (edu_f["attendance_status"] == "Late").astype(int)
    else:
        edu_f["is_absent"] = 0
        edu_f["is_late"] = 0
    if "gpa_like_score" not in edu_f.columns:
        edu_f["gpa_like_score"] = np.nan

    edu_monthly = (
        edu_f.groupby(["resident_id", "month_m"], as_index=False)
        .agg(
            attendance_rate_m=("attendance_rate", "mean"),
            progress_percent_m=("progress_percent", "mean"),
            gpa_like_score_m=("gpa_like_score", "mean"),
            absent_rate_m=("is_absent", "mean"),
            late_rate_m=("is_late", "mean"),
        )
    )
    panel = panel.merge(edu_monthly, on=["resident_id", "month_m"], how="left")

    vis_f = visits.copy()
    vis_f["month_m"] = month_start(vis_f["visit_date"])
    vis_f["unfavorable_visit"] = vis_f["visit_outcome"].isin(["Needs Improvement", "Unfavorable"]).astype(int)

    vis_monthly = (
        vis_f.groupby(["resident_id", "month_m"], as_index=False)
        .agg(
            visit_count_m=("visitation_id", "count"),
            safety_concerns_count_m=("safety_concerns_noted", "sum"),
            follow_up_needed_rate_m=("follow_up_needed", lambda s: _boolish_mean(s)),
            unfavorable_visit_rate_m=("unfavorable_visit", "mean"),
        )
    )
    panel = panel.merge(vis_monthly, on=["resident_id", "month_m"], how="left")

    plan_events = []
    for event_col, event_name in [("created_at", "intervention_created_m"), ("updated_at", "intervention_updated_m")]:
        if event_col not in plans.columns:
            continue
        tmp = plans[["resident_id", event_col]].copy()
        tmp["month_m"] = month_start(tmp[event_col])
        tmp = tmp.dropna(subset=["month_m"])
        tmp[event_name] = 1
        plan_events.append(tmp[["resident_id", "month_m", event_name]])

    if plan_events:
        plan_created = plan_events[0].groupby(["resident_id", "month_m"], as_index=False)["intervention_created_m"].sum()
        if len(plan_events) > 1:
            plan_updated = plan_events[1].groupby(["resident_id", "month_m"], as_index=False)[
                "intervention_updated_m"
            ].sum()
            plan_monthly = plan_created.merge(plan_updated, on=["resident_id", "month_m"], how="outer").fillna(0)
        else:
            plan_monthly = plan_created.rename(columns={"intervention_created_m": "intervention_created_m"})
            plan_monthly["intervention_updated_m"] = 0
    else:
        plan_monthly = pd.DataFrame(
            columns=["resident_id", "month_m", "intervention_created_m", "intervention_updated_m"]
        )

    if "intervention_created_m" not in plan_monthly.columns:
        plan_monthly["intervention_created_m"] = 0
    if "intervention_updated_m" not in plan_monthly.columns:
        plan_monthly["intervention_updated_m"] = 0
    plan_monthly["intervention_touches_m"] = (
        plan_monthly["intervention_created_m"] + plan_monthly["intervention_updated_m"]
    )
    panel = panel.merge(plan_monthly, on=["resident_id", "month_m"], how="left")

    inc_f = incidents.copy()
    inc_f["month_m"] = month_start(inc_f["incident_date"])
    inc_f["is_high"] = (inc_f["severity"] == "High").astype(int)
    inc_f["is_elevated"] = inc_f["severity"].isin(["Medium", "High"]).astype(int)

    inc_monthly = (
        inc_f.groupby(["resident_id", "month_m"], as_index=False)
        .agg(
            incident_count_m=("incident_id", "count"),
            high_incident_count_m=("is_high", "sum"),
            elevated_incident_count_m=("is_elevated", "sum"),
        )
    )
    inc_monthly["incident_any_m"] = (inc_monthly["incident_count_m"] > 0).astype(int)
    inc_monthly["high_incident_any_m"] = (inc_monthly["high_incident_count_m"] > 0).astype(int)
    inc_monthly["elevated_incident_any_m"] = (inc_monthly["elevated_incident_count_m"] > 0).astype(int)

    panel = panel.merge(inc_monthly, on=["resident_id", "month_m"], how="left")

    target_map = inc_monthly[
        ["resident_id", "month_m", "elevated_incident_any_m", "high_incident_any_m"]
    ].rename(
        columns={
            "month_m": "target_month",
            "elevated_incident_any_m": "y_next_elevated_incident",
            "high_incident_any_m": "y_next_high_incident_sensitivity",
        }
    )
    panel["target_month"] = panel["month_m"] + pd.offsets.MonthBegin(1)
    panel = panel.merge(target_map, on=["resident_id", "target_month"], how="left")

    resident_cols = [
        "resident_id",
        "safehouse_id",
        "case_category",
        "initial_risk_level",
        "current_risk_level",
        "referral_source",
        "has_special_needs",
        "is_pwd",
        "sub_cat_trafficked",
        "sub_cat_sexual_abuse",
    ]
    for c in resident_cols:
        if c not in residents.columns:
            residents[c] = np.nan
    resident_base = residents[resident_cols].copy()
    panel = panel.merge(resident_base, on="resident_id", how="left")

    max_incident_month = month_start(incidents["incident_date"]).max()
    model_df = panel[panel["target_month"] <= max_incident_month].copy()

    model_df["y_next_elevated_incident"] = model_df["y_next_elevated_incident"].fillna(0).astype(int)
    model_df["y_next_high_incident_sensitivity"] = model_df["y_next_high_incident_sensitivity"].fillna(0).astype(int)

    fill_zero_cols = [c for c in model_df.columns if c.endswith("_m") or c.startswith("delta_")]
    for col in fill_zero_cols:
        if col in model_df.columns:
            model_df[col] = model_df[col].fillna(0)

    model_df = model_df.sort_values(["resident_id", "month_m"]).copy()
    next_health = model_df.groupby("resident_id")["general_health_score_m"].shift(-1)
    next_concerns = model_df.groupby("resident_id")["concerns_rate_m"].shift(-1)
    next_progress = model_df.groupby("resident_id")["progress_rate_m"].shift(-1)
    next_elevated = model_df["y_next_elevated_incident"]

    health_drop = ((next_health - model_df["general_health_score_m"]) <= -0.35).fillna(False)
    high_concern_next = (next_concerns >= 0.50).fillna(False)
    low_progress_next = (next_progress <= 0.20).fillna(False)

    model_df[TARGET] = (
        (next_elevated == 1)
        | high_concern_next
        | health_drop
        | (low_progress_next & (next_concerns >= 0.30).fillna(False))
    ).astype(int)

    model_df["y_next_progressing"] = (
        ((next_elevated == 0) | next_elevated.isna())
        & (next_concerns <= 0.20).fillna(False)
        & (next_progress >= 0.70).fillna(False)
        & ((next_health - model_df["general_health_score_m"]) >= 0.10).fillna(False)
    ).astype(int)

    return model_df


def build_early_warning_model_df(data_dir: Path) -> pd.DataFrame:
    residents = pd.read_csv(data_dir / "residents.csv")
    health = pd.read_csv(data_dir / "health_wellbeing_records.csv")
    process = pd.read_csv(data_dir / "process_recordings.csv")
    education = pd.read_csv(data_dir / "education_records.csv")
    visits = pd.read_csv(data_dir / "home_visitations.csv")
    plans = pd.read_csv(data_dir / "intervention_plans.csv")
    incidents = pd.read_csv(data_dir / "incident_reports.csv")
    return _build_inner(residents, health, process, education, visits, plans, incidents)


def build_early_warning_model_df_from_payload(payload: dict[str, Any]) -> pd.DataFrame:
    f = caseload_payload_to_frames(payload)
    return _build_inner(
        f["residents"],
        f["health_wellbeing_records"],
        f["process_recordings"],
        f["education_records"],
        f["home_visitations"],
        f["intervention_plans"],
        f["incident_reports"],
    )


def caseload_payload_to_frames(payload: dict[str, Any]) -> dict[str, pd.DataFrame]:
    def _df(key: str) -> pd.DataFrame:
        rows = payload.get(key)
        if not rows:
            return pd.DataFrame()
        return pd.DataFrame(rows)

    return {
        "residents": _df("residents"),
        "health_wellbeing_records": _df("health_wellbeing_records"),
        "process_recordings": _df("process_recordings"),
        "education_records": _df("education_records"),
        "home_visitations": _df("home_visitations"),
        "intervention_plans": _df("intervention_plans"),
        "incident_reports": _df("incident_reports"),
    }


def feature_columns_for_model(df: pd.DataFrame) -> list[str]:
    return [c for c in df.columns if c not in LEAKAGE_EXCLUSIONS]


def time_split_train(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    months_sorted = np.array(sorted(df["month_m"].unique()))
    n_months = len(months_sorted)
    train_end = int(n_months * 0.70)
    valid_end = int(n_months * 0.85)
    train_months = months_sorted[:train_end]
    valid_months = months_sorted[train_end:valid_end]
    test_months = months_sorted[valid_end:]
    return (
        df[df["month_m"].isin(train_months)].copy(),
        df[df["month_m"].isin(valid_months)].copy(),
        df[df["month_m"].isin(test_months)].copy(),
    )


def make_rf_pipeline(numeric_features: list[str], categorical_features: list[str]) -> Pipeline:
    preprocess = ColumnTransformer(
        [
            ("num", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]), numeric_features),
            (
                "cat",
                Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore"))]),
                categorical_features,
            ),
        ]
    )
    return Pipeline(
        [
            ("prep", preprocess),
            (
                "model",
                RandomForestClassifier(
                    n_estimators=350,
                    min_samples_leaf=2,
                    class_weight="balanced_subsample",
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                ),
            ),
        ]
    )


def train_early_warning_rf(df: pd.DataFrame) -> tuple[Pipeline, list[str]]:
    train_df, _, _ = time_split_train(df)
    feats = feature_columns_for_model(df)
    X = train_df[feats]
    y = train_df[TARGET].astype(int)
    numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_features = [c for c in feats if c not in numeric_features]
    pipe = make_rf_pipeline(numeric_features, categorical_features)
    pipe.fit(X, y)
    return pipe, feats


def rows_for_month(df: pd.DataFrame, as_of: str) -> pd.DataFrame:
    ym = pd.Timestamp(as_of[:10]).to_period("M").to_timestamp()
    return df[df["month_m"] == ym].copy()


def predict_early_warning_proba(
    model: Pipeline,
    feature_cols: list[str],
    rows: list[dict[str, Any]],
) -> tuple[list[float], list[str | None]]:
    preds: list[float] = []
    errs: list[str | None] = []
    for raw in rows:
        try:
            row = {k: raw.get(k) for k in feature_cols}
            X = pd.DataFrame([row])
            for c in X.columns:
                if X[c].dtype == object:
                    X[c] = X[c].astype(str)
            p = float(model.predict_proba(X)[0, 1])
            preds.append(p)
            errs.append(None)
        except Exception as ex:  # noqa: BLE001
            preds.append(float("nan"))
            errs.append(str(ex))
    return preds, errs
