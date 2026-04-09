"""
Resident next-month wellbeing — aligned with ml-pipelines/resident_wellbeing_next_month.ipynb.
Target: wellbeing_next (composite mean of four subscores in month m+1).
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

TARGET = "wellbeing_next"
DROP_FOR_MODEL = {TARGET, "record_date", "ym"}

# Tuned in notebook (RandomizedSearchCV + GroupKFold)
RF_BEST = {
    "n_estimators": 350,
    "min_samples_leaf": 4,
    "max_features": 0.7,
    "max_depth": 8,
    "random_state": 42,
    "n_jobs": -1,
}


def to_year_month(df: pd.DataFrame, col: str) -> pd.DataFrame:
    out = df.copy()
    out["_dt"] = pd.to_datetime(out[col], errors="coerce")
    out["ym"] = out["_dt"].dt.to_period("M")
    return out.drop(columns=["_dt"])


def _read_tables(data_dir: Path) -> tuple[pd.DataFrame, ...]:
    health_raw = pd.read_csv(data_dir / "health_wellbeing_records.csv")
    pr = pd.read_csv(data_dir / "process_recordings.csv")
    hv = pd.read_csv(data_dir / "home_visitations.csv")
    edu = pd.read_csv(data_dir / "education_records.csv")
    inc = pd.read_csv(data_dir / "incident_reports.csv")
    ip = pd.read_csv(data_dir / "intervention_plans.csv")
    res = pd.read_csv(data_dir / "residents.csv")
    sh = pd.read_csv(data_dir / "safehouses.csv")
    return health_raw, pr, hv, edu, inc, ip, res, sh


def _tables_from_frames(
    health_raw: pd.DataFrame,
    pr: pd.DataFrame,
    hv: pd.DataFrame,
    edu: pd.DataFrame,
    inc: pd.DataFrame,
    ip: pd.DataFrame,
    res: pd.DataFrame,
    sh: pd.DataFrame,
) -> pd.DataFrame:
    """Build master modeling frame (same as notebook)."""
    # --- Health panel
    health = to_year_month(health_raw, "record_date")
    health["wellbeing"] = health[
        [
            "general_health_score",
            "sleep_quality_score",
            "nutrition_score",
            "energy_level_score",
        ]
    ].mean(axis=1)
    health_month = health.groupby(["resident_id", "ym"], as_index=False).agg(
        wellbeing=("wellbeing", "mean"),
        record_date=("record_date", "min"),
    )
    hm = health_month.sort_values(["resident_id", "ym"])
    fwd = hm[["resident_id", "ym", "wellbeing"]].copy()
    fwd["ym"] = fwd["ym"] + 1
    fwd = fwd.rename(columns={"wellbeing": "wellbeing_next"})
    panel = hm.merge(fwd, on=["resident_id", "ym"], how="inner")
    panel = panel.rename(columns={"wellbeing": "wellbeing_lag"})

    # --- process_recordings
    for c in ["progress_noted", "concerns_flagged", "referral_made"]:
        if pr[c].dtype == object:
            pr[c] = pr[c].map(lambda x: str(x).lower() in ("true", "1", "yes"))
        pr[c] = pr[c].astype(bool)
    pr = to_year_month(pr, "session_date")
    neg_end = {"Distressed", "Withdrawn", "Sad", "Angry", "Anxious"}
    pr["negative_end"] = pr["emotional_state_end"].isin(neg_end).astype(int)
    pr_feats = pr.groupby(["resident_id", "ym"], as_index=False).agg(
        n_sessions=("recording_id", "count"),
        total_session_minutes=("session_duration_minutes", "sum"),
        mean_session_minutes=("session_duration_minutes", "mean"),
        n_session_workers=("social_worker", "nunique"),
        share_negative_end=("negative_end", "mean"),
        share_progress_noted=("progress_noted", "mean"),
        share_concerns=("concerns_flagged", "mean"),
        share_referral=("referral_made", "mean"),
    )

    # --- home_visitations
    for c in ["safety_concerns_noted", "follow_up_needed"]:
        if hv[c].dtype == object:
            hv[c] = hv[c].map(lambda x: str(x).lower() in ("true", "1", "yes"))
        hv[c] = hv[c].astype(bool)
    hv = to_year_month(hv, "visit_date")
    hv_feats = hv.groupby(["resident_id", "ym"], as_index=False).agg(
        n_visits=("visitation_id", "count"),
        share_safety_concern=("safety_concerns_noted", "mean"),
        share_follow_up_needed=("follow_up_needed", "mean"),
        n_visit_workers=("social_worker", "nunique"),
    )

    # --- education
    edu = to_year_month(edu, "record_date")
    edu_feats = edu.groupby(["resident_id", "ym"], as_index=False).agg(
        n_edu_rows=("education_record_id", "count"),
        mean_attendance_rate=("attendance_rate", "mean"),
        mean_progress_percent=("progress_percent", "mean"),
    )

    # --- incidents
    sev_map = {"Low": 1, "Medium": 2, "High": 3}
    inc["severity_ord"] = inc["severity"].map(sev_map)
    inc = to_year_month(inc, "incident_date")
    inc_feats = inc.groupby(["resident_id", "ym"], as_index=False).agg(
        n_incidents=("incident_id", "count"),
        max_severity=("severity_ord", "max"),
        mean_severity=("severity_ord", "mean"),
    )

    # --- intervention plans
    ip["created_ym"] = pd.to_datetime(ip["created_at"], errors="coerce").dt.to_period("M")
    ip["updated_ym"] = pd.to_datetime(ip["updated_at"], errors="coerce").dt.to_period("M")
    rows = []
    for _, r in ip.iterrows():
        rid = r["resident_id"]
        for label, ym in [("created", r["created_ym"]), ("updated", r["updated_ym"])]:
            if pd.isna(ym):
                continue
            rows.append((rid, ym, label))
    touch = pd.DataFrame(rows, columns=["resident_id", "ym", "kind"])
    ip_feats = touch.groupby(["resident_id", "ym"], as_index=False).agg(
        intervention_touches=("kind", "count"),
        intervention_created=("kind", lambda s: int((s == "created").sum())),
        intervention_updated=("kind", lambda s: int((s == "updated").sum())),
    )

    # --- static
    risk_map = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
    res["initial_risk_ord"] = res["initial_risk_level"].map(risk_map)
    res["current_risk_ord"] = res["current_risk_level"].map(risk_map)
    bool_cols = [
        c
        for c in res.columns
        if c.startswith("sub_cat_") or c.startswith("family_") or c in ("is_pwd", "has_special_needs")
    ]
    for c in bool_cols:
        if res[c].dtype == object:
            res[c] = res[c].map(lambda x: str(x).lower() in ("true", "1", "yes"))
        res[c] = res[c].fillna(False).astype(bool)
    static = res[
        ["resident_id", "safehouse_id", "case_status", "case_category", "initial_risk_ord", "current_risk_ord"]
        + bool_cols
    ].merge(
        sh[["safehouse_id", "region", "capacity_girls", "current_occupancy"]],
        on="safehouse_id",
        how="left",
    )
    static["occupancy_ratio"] = static["current_occupancy"] / static["capacity_girls"].replace(0, np.nan)

    # --- merge
    df = panel.merge(pr_feats, on=["resident_id", "ym"], how="left")
    df = df.merge(hv_feats, on=["resident_id", "ym"], how="left")
    df = df.merge(edu_feats, on=["resident_id", "ym"], how="left")
    df = df.merge(inc_feats, on=["resident_id", "ym"], how="left")
    df = df.merge(ip_feats, on=["resident_id", "ym"], how="left")
    df = df.merge(static, on="resident_id", how="left")

    fill_zero = [
        "n_sessions",
        "total_session_minutes",
        "mean_session_minutes",
        "n_session_workers",
        "n_visits",
        "n_visit_workers",
        "n_edu_rows",
        "n_incidents",
        "intervention_touches",
        "intervention_created",
        "intervention_updated",
    ]
    for c in fill_zero:
        if c in df.columns:
            df[c] = df[c].fillna(0)
    for c in [
        "share_negative_end",
        "share_progress_noted",
        "share_concerns",
        "share_referral",
        "share_safety_concern",
        "share_follow_up_needed",
        "mean_attendance_rate",
        "mean_progress_percent",
        "max_severity",
        "mean_severity",
    ]:
        if c in df.columns:
            df[c] = df[c].fillna(0)

    df = df.dropna(subset=["wellbeing_next", "safehouse_id"])
    return df


def build_master_dataframe(data_dir: Path) -> pd.DataFrame:
    tables = _read_tables(data_dir)
    return _tables_from_frames(*tables)


def feature_columns(df: pd.DataFrame) -> list[str]:
    return [c for c in df.columns if c not in DROP_FOR_MODEL and c != "resident_id"]


def make_rf_pipeline(train_features: pd.DataFrame, feature_cols: list[str]) -> Pipeline:
    X = train_features[feature_cols]
    cat_cols = X.select_dtypes(include=["object", "category"]).columns.tolist()
    num_cols = [c for c in feature_cols if c not in cat_cols]

    categorical_pipe = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "onehot",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False, max_categories=25),
            ),
        ]
    )
    rf_preprocess = ColumnTransformer(
        transformers=[
            ("num", Pipeline([("imputer", SimpleImputer(strategy="median"))]), num_cols),
            ("cat", categorical_pipe, cat_cols),
        ]
    )
    return Pipeline(
        [
            ("prep", rf_preprocess),
            ("model", RandomForestRegressor(**RF_BEST)),
        ]
    )


def time_split_train_test(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    df = df.sort_values("ym")
    months = sorted(df["ym"].unique())
    cut = max(1, int(len(months) * 0.8))
    train_months = set(months[:cut])
    test_months = set(months[cut:])
    train_df = df[df["ym"].isin(train_months)].copy()
    test_df = df[df["ym"].isin(test_months)].copy()
    return train_df, test_df


def train_resident_wellbeing_rf(df: pd.DataFrame) -> tuple[Pipeline, list[str]]:
    """Fit RF on time-based train split; returns (pipeline, feature_cols)."""
    train_df, _ = time_split_train_test(df)
    feats = feature_columns(df)
    X_train = train_df[feats]
    y_train = train_df[TARGET]
    pipe = make_rf_pipeline(train_df, feats)
    pipe.fit(X_train, y_train)
    return pipe, feats


def build_master_from_api_payload(payload: dict) -> pd.DataFrame:
    """Build master frame from JSON-shaped dicts (same keys as CSV columns)."""

    def _df(key: str) -> pd.DataFrame:
        rows = payload.get(key)
        if not rows:
            return pd.DataFrame()
        return pd.DataFrame(rows)

    return _tables_from_frames(
        _df("health_wellbeing_records"),
        _df("process_recordings"),
        _df("home_visitations"),
        _df("education_records"),
        _df("incident_reports"),
        _df("intervention_plans"),
        _df("residents"),
        _df("safehouses"),
    )


def rows_for_month(df: pd.DataFrame, as_of: str) -> pd.DataFrame:
    """Filter master frame to feature month `as_of` (YYYY-MM-DD or YYYY-MM)."""
    ym = pd.Timestamp(as_of[:10]).to_period("M")
    out = df[df["ym"] == ym].copy()
    return out


def predict_wellbeing_next(
    model: Pipeline,
    feature_cols: list[str],
    rows: list[dict],
) -> tuple[list[float], list[str | None]]:
    """Batch predict from list of feature dicts (no target). Returns (preds, errors)."""
    if not rows:
        return [], []
    out_pred: list[float] = []
    out_err: list[str | None] = []
    for raw in rows:
        try:
            row = {k: raw.get(k) for k in feature_cols}
            X = pd.DataFrame([row])
            for c in X.columns:
                if X[c].dtype == object:
                    X[c] = X[c].astype(str)
            p = float(model.predict(X)[0])
            out_pred.append(p)
            out_err.append(None)
        except Exception as ex:  # noqa: BLE001
            out_pred.append(float("nan"))
            out_err.append(str(ex))
    return out_pred, out_err
