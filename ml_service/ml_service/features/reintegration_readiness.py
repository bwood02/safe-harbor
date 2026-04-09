"""
Reintegration readiness — aligned with ml-pipelines/reintegration_readiness_next_month.ipynb.
Target: y_ready_within_3m (completion proxy within next 3 months).
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

PRIMARY_TARGET = "y_ready_within_3m"
RANDOM_STATE = 42

LEAKAGE_EXCLUSIONS = {
    "y_next_ready",
    "y_ready_within_3m",
    "is_completed_now",
    "completion_month_proxy",
    "next_month",
    "reintegration_status",
    "reintegration_type",
    "resident_id",
    "month",
    "date_of_admission",
    "split",
}


def month_key(series: pd.Series) -> pd.Series:
    return pd.to_datetime(series, errors="coerce").dt.to_period("M").dt.to_timestamp()


def yes_no_to_bin(series: pd.Series) -> pd.Series:
    if pd.api.types.is_bool_dtype(series):
        return series.astype(int)
    if pd.api.types.is_numeric_dtype(series):
        return (series.fillna(0) > 0).astype(int)
    mapped = (
        series.astype(str).str.strip().str.lower().map(
            {"yes": 1, "true": 1, "1": 1, "no": 0, "false": 0, "0": 0}
        )
    )
    return mapped.fillna(0).astype(int)


def add_rollups(monthly_df: pd.DataFrame, id_col: str = "resident_id", month_col: str = "month") -> pd.DataFrame:
    monthly_df = monthly_df.sort_values([id_col, month_col]).copy()
    num_cols = [c for c in monthly_df.columns if c not in [id_col, month_col]]
    out = monthly_df[[id_col, month_col]].copy()
    for c in num_cols:
        grp = monthly_df.groupby(id_col)[c]
        out[f"{c}_3m_mean"] = grp.transform(lambda s: s.rolling(3, min_periods=1).mean())
        out[f"{c}_3m_sum"] = grp.transform(lambda s: s.rolling(3, min_periods=1).sum())
        out[f"{c}_cum_mean"] = grp.transform(lambda s: s.expanding().mean().reset_index(level=0, drop=True))
        out[f"{c}_cum_sum"] = grp.transform(lambda s: s.expanding().sum().reset_index(level=0, drop=True))
    return out


def _build_inner(
    residents: pd.DataFrame,
    process: pd.DataFrame,
    home: pd.DataFrame,
    edu: pd.DataFrame,
    health: pd.DataFrame,
    interventions: pd.DataFrame,
    incidents: pd.DataFrame,
) -> pd.DataFrame:
    for df, col in [
        (process, "session_date"),
        (home, "visit_date"),
        (edu, "record_date"),
        (health, "record_date"),
        (interventions, "created_at"),
        (incidents, "incident_date"),
        (residents, "date_of_admission"),
    ]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")

    residents = residents.copy()
    residents["is_completed_now"] = (
        residents["reintegration_status"].fillna("").str.lower() == "completed"
    ).astype(int)

    activity_frames = []
    for df, date_col in [
        (process[["resident_id", "session_date"]].copy(), "session_date"),
        (home[["resident_id", "visit_date"]].copy(), "visit_date"),
        (edu[["resident_id", "record_date"]].copy(), "record_date"),
        (health[["resident_id", "record_date"]].copy(), "record_date"),
        (interventions[["resident_id", "created_at"]].copy(), "created_at"),
        (incidents[["resident_id", "incident_date"]].copy(), "incident_date"),
    ]:
        df["month"] = month_key(df[date_col])
        activity_frames.append(df[["resident_id", "month"]])

    base = pd.concat(activity_frames, ignore_index=True).dropna().drop_duplicates()
    base = base.merge(
        residents[
            [
                "resident_id",
                "is_completed_now",
                "date_of_admission",
                "safehouse_id",
                "case_category",
                "initial_risk_level",
                "current_risk_level",
            ]
        ],
        on="resident_id",
        how="left",
    )
    base["months_since_admission"] = (
        (base["month"].dt.year - base["date_of_admission"].dt.year) * 12
        + (base["month"].dt.month - base["date_of_admission"].dt.month)
    ).clip(lower=0)

    proc = process.copy()
    proc["month"] = month_key(proc["session_date"])
    proc["concerns_flagged_bin"] = yes_no_to_bin(proc["concerns_flagged"])
    proc["referral_made_bin"] = yes_no_to_bin(proc["referral_made"])
    proc["progress_noted_bin"] = yes_no_to_bin(proc["progress_noted"])
    emotion_risk = {"Calm": 0, "Neutral": 1, "Anxious": 2, "Distressed": 3, "Withdrawn": 2, "Angry": 2}
    proc["emotion_observed_score"] = proc["emotional_state_observed"].map(emotion_risk).fillna(1)
    proc["emotion_end_score"] = proc["emotional_state_end"].map(emotion_risk).fillna(1)
    proc_m = proc.groupby(["resident_id", "month"], as_index=False).agg(
        sessions=("recording_id", "count"),
        session_minutes=("session_duration_minutes", "sum"),
        concern_rate=("concerns_flagged_bin", "mean"),
        referral_rate=("referral_made_bin", "mean"),
        progress_rate=("progress_noted_bin", "mean"),
        emotion_observed_mean=("emotion_observed_score", "mean"),
        emotion_end_mean=("emotion_end_score", "mean"),
    )
    proc_roll = add_rollups(proc_m)

    home2 = home.copy()
    home2["month"] = month_key(home2["visit_date"])
    home2["safety_concern_bin"] = yes_no_to_bin(home2["safety_concerns_noted"])
    home2["follow_up_bin"] = yes_no_to_bin(home2["follow_up_needed"])
    coop_map = {"High": 2, "Medium": 1, "Low": 0}
    home2["cooperation_score"] = home2["family_cooperation_level"].map(coop_map).fillna(1)
    home_m = home2.groupby(["resident_id", "month"], as_index=False).agg(
        visits=("visitation_id", "count"),
        safety_concern_rate=("safety_concern_bin", "mean"),
        followup_rate=("follow_up_bin", "mean"),
        cooperation_mean=("cooperation_score", "mean"),
    )
    home_roll = add_rollups(home_m)

    edu2 = edu.copy()
    edu2["month"] = month_key(edu2["record_date"])
    edu_m = edu2.groupby(["resident_id", "month"], as_index=False).agg(
        attendance_rate=("attendance_rate", "mean"),
        progress_percent=("progress_percent", "mean"),
    )
    edu_roll = add_rollups(edu_m)

    health2 = health.copy()
    health2["month"] = month_key(health2["record_date"])
    health_m = health2.groupby(["resident_id", "month"], as_index=False).agg(
        general_health_score=("general_health_score", "mean"),
        nutrition_score=("nutrition_score", "mean"),
        sleep_quality_score=("sleep_quality_score", "mean"),
        energy_level_score=("energy_level_score", "mean"),
    )
    health_roll = add_rollups(health_m)

    ip = interventions.copy()
    ip["month"] = month_key(ip["created_at"])
    ip["is_open"] = ip["status"].fillna("").str.lower().isin(["open", "in progress"]).astype(int)
    ip["is_achieved"] = ip["status"].fillna("").str.lower().eq("achieved").astype(int)
    ip_m = ip.groupby(["resident_id", "month"], as_index=False).agg(
        intervention_count=("plan_id", "count"),
        open_share=("is_open", "mean"),
        achieved_share=("is_achieved", "mean"),
    )
    ip_roll = add_rollups(ip_m)

    inc = incidents.copy()
    inc["month"] = month_key(inc["incident_date"])
    sev_map = {"Low": 1, "Medium": 2, "High": 3}
    inc["severity_score"] = inc["severity"].map(sev_map).fillna(1)
    inc["followup_required_bin"] = yes_no_to_bin(inc["follow_up_required"])
    inc_m = inc.groupby(["resident_id", "month"], as_index=False).agg(
        incident_count=("incident_id", "count"),
        incident_severity_mean=("severity_score", "mean"),
        incident_followup_rate=("followup_required_bin", "mean"),
    )
    inc_roll = add_rollups(inc_m)

    feature_df = base.copy()
    for block in [proc_roll, home_roll, edu_roll, health_roll, ip_roll, inc_roll]:
        feature_df = feature_df.merge(block, on=["resident_id", "month"], how="left")

    for c in feature_df.columns:
        if c.endswith("_sum") or "count" in c or "sessions" in c or "visits" in c:
            feature_df[c] = feature_df[c].fillna(0)

    feature_df = feature_df.sort_values(["resident_id", "month"]).copy()
    completion_month_map = (
        feature_df.loc[feature_df["is_completed_now"] == 1].groupby("resident_id")["month"].max()
    )
    feature_df["completion_month_proxy"] = feature_df["resident_id"].map(completion_month_map)
    feature_df["next_month"] = (feature_df["month"] + pd.offsets.MonthBegin(1)).dt.normalize()
    feature_df["y_next_ready"] = (
        feature_df["completion_month_proxy"].notna()
        & (feature_df["next_month"] == feature_df["completion_month_proxy"])
    ).astype(int)
    _p_comp = feature_df["completion_month_proxy"].dt.to_period("M")
    _p_start = feature_df["next_month"].dt.to_period("M")
    feature_df["y_ready_within_3m"] = (
        feature_df["completion_month_proxy"].notna()
        & (_p_comp >= _p_start)
        & (_p_comp <= _p_start + 2)
    ).astype(int)
    feature_df = feature_df[
        feature_df["completion_month_proxy"].isna()
        | (feature_df["month"] < feature_df["completion_month_proxy"])
    ].copy()

    candidate_cols = [
        c
        for c in feature_df.columns
        if c not in ["resident_id", "month", "y_next_ready", "y_ready_within_3m", "date_of_admission"]
    ]
    non_cat = [
        c
        for c in candidate_cols
        if c not in ["safehouse_id", "case_category", "initial_risk_level", "current_risk_level"]
    ]
    feature_df = feature_df.dropna(subset=non_cat, how="all")
    return feature_df


def build_reintegration_model_df(data_dir: Path) -> pd.DataFrame:
    residents = pd.read_csv(data_dir / "residents.csv")
    process = pd.read_csv(data_dir / "process_recordings.csv")
    home = pd.read_csv(data_dir / "home_visitations.csv")
    edu = pd.read_csv(data_dir / "education_records.csv")
    health = pd.read_csv(data_dir / "health_wellbeing_records.csv")
    interventions = pd.read_csv(data_dir / "intervention_plans.csv")
    incidents = pd.read_csv(data_dir / "incident_reports.csv")
    return _build_inner(residents, process, home, edu, health, interventions, incidents)


def caseload_payload_to_frames(payload: dict[str, Any]) -> dict[str, pd.DataFrame]:
    def _df(key: str) -> pd.DataFrame:
        rows = payload.get(key)
        if not rows:
            return pd.DataFrame()
        return pd.DataFrame(rows)

    return {
        "residents": _df("residents"),
        "process_recordings": _df("process_recordings"),
        "home_visitations": _df("home_visitations"),
        "education_records": _df("education_records"),
        "health_wellbeing_records": _df("health_wellbeing_records"),
        "intervention_plans": _df("intervention_plans"),
        "incident_reports": _df("incident_reports"),
    }


def build_reintegration_model_df_from_payload(payload: dict[str, Any]) -> pd.DataFrame:
    f = caseload_payload_to_frames(payload)
    return _build_inner(
        f["residents"],
        f["process_recordings"],
        f["home_visitations"],
        f["education_records"],
        f["health_wellbeing_records"],
        f["intervention_plans"],
        f["incident_reports"],
    )


def feature_columns_for_model(df: pd.DataFrame) -> list[str]:
    return [c for c in df.columns if c not in LEAKAGE_EXCLUSIONS]


def time_split_train(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    months = sorted(df["month"].dropna().unique())
    if len(months) < 5:
        raise ValueError("Not enough distinct months for time split.")
    n = len(months)
    train_end = max(1, int(n * 0.6))
    val_end = max(train_end + 1, int(n * 0.8))
    train_months = months[:train_end]
    val_months = months[train_end:val_end]
    test_months = months[val_end:]
    tr = df[df["month"].isin(train_months)].copy()
    va = df[df["month"].isin(val_months)].copy()
    te = df[df["month"].isin(test_months)].copy()
    return tr, va, te


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


def train_reintegration_rf(df: pd.DataFrame) -> tuple[Pipeline, list[str]]:
    train_df, _, _ = time_split_train(df)
    feats = feature_columns_for_model(df)
    X = train_df[feats]
    y = train_df[PRIMARY_TARGET].astype(int)
    numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_features = [c for c in feats if c not in numeric_features]
    pipe = make_rf_pipeline(numeric_features, categorical_features)
    pipe.fit(X, y)
    return pipe, feats


def rows_for_month(df: pd.DataFrame, as_of: str) -> pd.DataFrame:
    ym = pd.Timestamp(as_of[:10]).to_period("M").to_timestamp()
    out = df[df["month"] == ym].copy()
    return out


def predict_reintegration_proba(
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
