"""
High-value donor profiles — aligned with ml-pipelines/high_value_donor_profiles.ipynb.
Target: is_high_value_fwd (top ~20% forward 12m value per snapshot month).
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
from sklearn.preprocessing import OneHotEncoder

TOP_Q = 0.20
RANDOM_STATE = 42

FEATURE_COLS_NUM = [
    "tenure_months",
    "days_since_last_donation",
    "donations_3m",
    "donations_6m",
    "donations_12m",
    "value_3m",
    "value_12m",
    "avg_gift_12m",
    "is_recurring_rate_12m",
    "channel_entropy_12m",
    "campaign_response_count_12m",
    "program_area_focus_ratio",
    "alloc_total_12m",
    "monetary_share_12m",
    "inkind_share_12m",
    "time_share_12m",
    "skills_share_12m",
    "social_share_12m",
]
FEATURE_COLS_CAT = ["supporter_type", "relationship_type", "region", "country", "acquisition_channel"]
FEATURE_COLS = FEATURE_COLS_NUM + FEATURE_COLS_CAT

TARGET = "is_high_value_fwd"


def _build_model_df(
    supporters: pd.DataFrame,
    donations: pd.DataFrame,
    donation_allocations: pd.DataFrame,
) -> pd.DataFrame:
    supporters = supporters.copy()
    donations = donations.copy()
    donation_allocations = donation_allocations.copy()

    supporters["created_at"] = pd.to_datetime(supporters["created_at"], errors="coerce")
    donations["donation_date"] = pd.to_datetime(donations["donation_date"], errors="coerce")
    donations = donations.dropna(subset=["donation_date"]).copy()
    donations["donation_month"] = donations["donation_date"].dt.to_period("M").dt.to_timestamp("M")
    donations["amount"] = pd.to_numeric(donations["amount"], errors="coerce")
    donations["estimated_value"] = pd.to_numeric(donations["estimated_value"], errors="coerce")
    donations["donation_value"] = donations["amount"].fillna(donations["estimated_value"]).fillna(0).clip(lower=0)

    if donation_allocations.empty or "allocation_date" not in donation_allocations.columns:
        donation_allocations = pd.DataFrame(columns=["donation_id", "allocation_date", "program_area", "amount_allocated"])
    else:
        donation_allocations["allocation_date"] = pd.to_datetime(donation_allocations["allocation_date"], errors="coerce")
        donation_allocations["amount_allocated"] = pd.to_numeric(donation_allocations["amount_allocated"], errors="coerce").fillna(0)

    all_months = pd.date_range(
        donations["donation_month"].min(),
        donations["donation_month"].max(),
        freq="ME",
    )
    max_snapshot_month = all_months.max() - pd.offsets.MonthEnd(12)
    snapshot_months = all_months[all_months <= max_snapshot_month]

    supporter_base = supporters[
        ["supporter_id", "supporter_type", "relationship_type", "region", "country", "acquisition_channel", "created_at"]
    ].copy()
    supporter_base["created_month"] = supporter_base["created_at"].dt.to_period("M").dt.to_timestamp("M")
    supporter_base["created_month"] = supporter_base["created_month"].fillna(snapshot_months.min())

    snap_df = pd.DataFrame({"snapshot_month": snapshot_months})
    panel = supporter_base.assign(_k=1).merge(snap_df.assign(_k=1), on="_k", how="inner").drop(columns="_k")
    panel = panel[panel["snapshot_month"] >= panel["created_month"]].copy()

    monthly = (
        donations.groupby(["supporter_id", "donation_month"], as_index=False)
        .agg(
            monthly_donations=("donation_id", "count"),
            monthly_value=("donation_value", "sum"),
            monthly_monetary_value=("amount", "sum"),
            monthly_recurring=("is_recurring", lambda s: pd.Series(s).fillna(False).astype(int).sum()),
            monthly_unique_channels=("channel_source", pd.Series.nunique),
            monthly_unique_campaigns=("campaign_name", lambda s: pd.Series(s).dropna().nunique()),
            monthly_monetary_count=("donation_type", lambda s: (pd.Series(s) == "Monetary").sum()),
            monthly_inkind_count=("donation_type", lambda s: (pd.Series(s) == "InKind").sum()),
            monthly_time_count=("donation_type", lambda s: (pd.Series(s) == "Time").sum()),
            monthly_skills_count=("donation_type", lambda s: (pd.Series(s) == "Skills").sum()),
            monthly_social_count=("donation_type", lambda s: (pd.Series(s) == "SocialMedia").sum()),
        )
    )

    monthly_grid = panel[["supporter_id", "snapshot_month"]].rename(columns={"snapshot_month": "donation_month"})
    monthly = monthly_grid.merge(monthly, on=["supporter_id", "donation_month"], how="left")
    fill_zero_cols = [c for c in monthly.columns if c not in ["supporter_id", "donation_month"]]
    monthly[fill_zero_cols] = monthly[fill_zero_cols].fillna(0)
    monthly = monthly.sort_values(["supporter_id", "donation_month"]).reset_index(drop=True)

    for w in [3, 6, 12]:
        monthly[f"donations_{w}m"] = monthly.groupby("supporter_id")["monthly_donations"].transform(
            lambda s: s.rolling(w, min_periods=1).sum()
        )
        monthly[f"value_{w}m"] = monthly.groupby("supporter_id")["monthly_value"].transform(
            lambda s: s.rolling(w, min_periods=1).sum()
        )
        monthly[f"monetary_value_{w}m"] = monthly.groupby("supporter_id")["monthly_monetary_value"].transform(
            lambda s: s.rolling(w, min_periods=1).sum()
        )
        monthly[f"campaign_response_count_{w}m"] = monthly.groupby("supporter_id")["monthly_unique_campaigns"].transform(
            lambda s: s.rolling(w, min_periods=1).sum()
        )

    monthly["cum_value_to_t"] = monthly.groupby("supporter_id")["monthly_value"].cumsum()
    monthly["cum_donations_to_t"] = monthly.groupby("supporter_id")["monthly_donations"].cumsum()
    monthly["avg_gift_12m"] = np.where(
        monthly["donations_12m"] > 0, monthly["value_12m"] / monthly["donations_12m"], 0
    )
    monthly["is_recurring_rate_12m"] = monthly.groupby("supporter_id")["monthly_recurring"].transform(
        lambda s: s.rolling(12, min_periods=1).sum()
    )
    monthly["is_recurring_rate_12m"] = np.where(
        monthly["donations_12m"] > 0, monthly["is_recurring_rate_12m"] / monthly["donations_12m"], 0
    )

    for src in ["monetary", "inkind", "time", "skills", "social"]:
        monthly[f"{src}_share_12m"] = np.where(
            monthly["donations_12m"] > 0,
            monthly.groupby("supporter_id")[f"monthly_{src}_count"].transform(lambda s: s.rolling(12, min_periods=1).sum())
            / monthly["donations_12m"],
            0,
        )

    monthly["had_donation_this_month"] = monthly["monthly_donations"] > 0
    monthly["last_donation_month"] = monthly["donation_month"].where(monthly["had_donation_this_month"])
    monthly["last_donation_month"] = monthly.groupby("supporter_id")["last_donation_month"].ffill()
    monthly["days_since_last_donation"] = (monthly["donation_month"] - monthly["last_donation_month"]).dt.days
    monthly["days_since_last_donation"] = monthly["days_since_last_donation"].fillna(9999)
    monthly["channel_entropy_12m"] = monthly.groupby("supporter_id")["monthly_unique_channels"].transform(
        lambda s: s.rolling(12, min_periods=1).mean()
    )

    fwd_parts = [monthly.groupby("supporter_id")["monthly_value"].shift(-k) for k in range(1, 13)]
    monthly["forward_12m_value"] = pd.concat(fwd_parts, axis=1).sum(axis=1, min_count=1).fillna(0)

    if not donation_allocations.empty and "donation_id" in donation_allocations.columns:
        alloc = donation_allocations.copy()
        alloc["allocation_month"] = alloc["allocation_date"].dt.to_period("M").dt.to_timestamp("M")
        alloc_monthly = (
            donations[["donation_id", "supporter_id"]]
            .merge(alloc[["donation_id", "allocation_month", "program_area", "amount_allocated"]], on="donation_id", how="inner")
            .dropna(subset=["allocation_month"])
        )
        if not alloc_monthly.empty:
            alloc_agg = alloc_monthly.groupby(["supporter_id", "allocation_month", "program_area"], as_index=False)[
                "amount_allocated"
            ].sum()
            alloc_pivot = alloc_agg.pivot_table(
                index=["supporter_id", "allocation_month"],
                columns="program_area",
                values="amount_allocated",
                aggfunc="sum",
                fill_value=0,
            ).reset_index()
            alloc_pivot.columns = [
                "supporter_id" if c == "supporter_id" else ("allocation_month" if c == "allocation_month" else f"alloc_{c}")
                for c in alloc_pivot.columns
            ]
            alloc_grid = panel[["supporter_id", "snapshot_month"]].rename(columns={"snapshot_month": "allocation_month"})
            alloc_feat = alloc_grid.merge(alloc_pivot, on=["supporter_id", "allocation_month"], how="left").fillna(0)
            alloc_cols = [c for c in alloc_feat.columns if c.startswith("alloc_") and c != "allocation_month"]
            for c in alloc_cols:
                alloc_feat[f"{c}_12m"] = alloc_feat.groupby("supporter_id")[c].transform(lambda s: s.rolling(12, min_periods=1).sum())
            alloc_12m_cols = [c for c in alloc_feat.columns if c.endswith("_12m")]
            alloc_feat["alloc_total_12m"] = alloc_feat[alloc_12m_cols].sum(axis=1)
            alloc_feat["program_area_focus_ratio"] = np.where(
                alloc_feat["alloc_total_12m"] > 0,
                alloc_feat[alloc_12m_cols].max(axis=1) / alloc_feat["alloc_total_12m"],
                0,
            )
            alloc_out = alloc_feat[["supporter_id", "allocation_month", "program_area_focus_ratio", "alloc_total_12m"]].rename(
                columns={"allocation_month": "snapshot_month"}
            )
        else:
            alloc_out = panel[["supporter_id", "snapshot_month"]].copy()
            alloc_out["program_area_focus_ratio"] = 0.0
            alloc_out["alloc_total_12m"] = 0.0
    else:
        alloc_out = panel[["supporter_id", "snapshot_month"]].copy()
        alloc_out["program_area_focus_ratio"] = 0.0
        alloc_out["alloc_total_12m"] = 0.0

    model_df = panel.merge(monthly.rename(columns={"donation_month": "snapshot_month"}), on=["supporter_id", "snapshot_month"], how="left")
    model_df = model_df.merge(alloc_out, on=["supporter_id", "snapshot_month"], how="left")
    model_df[["program_area_focus_ratio", "alloc_total_12m"]] = model_df[["program_area_focus_ratio", "alloc_total_12m"]].fillna(0)

    model_df["tenure_days"] = (model_df["snapshot_month"] - model_df["created_month"]).dt.days.clip(lower=0)
    model_df["tenure_months"] = np.floor(model_df["tenure_days"] / 30.4)

    model_df["is_high_value_asof"] = model_df.groupby("snapshot_month")["cum_value_to_t"].transform(
        lambda s: (s.rank(method="first", ascending=False) <= max(1, int(np.ceil(TOP_Q * len(s))))).astype(int)
    )
    model_df[TARGET] = model_df.groupby("snapshot_month")["forward_12m_value"].transform(
        lambda s: (s.rank(method="first", ascending=False) <= max(1, int(np.ceil(TOP_Q * len(s))))).astype(int)
    )

    return model_df


def build_donor_high_value_model_df(data_dir: Path) -> pd.DataFrame:
    supporters = pd.read_csv(data_dir / "supporters.csv")
    donations = pd.read_csv(data_dir / "donations.csv")
    donation_allocations = pd.read_csv(data_dir / "donation_allocations.csv")
    return _build_model_df(supporters, donations, donation_allocations)


def build_donor_high_value_model_df_from_payload(payload: dict[str, Any]) -> pd.DataFrame:
    def _df(key: str) -> pd.DataFrame:
        rows = payload.get(key)
        if not rows:
            return pd.DataFrame()
        return pd.DataFrame(rows)

    return _build_model_df(_df("supporters"), _df("donations"), _df("donation_allocations"))


def time_split_train(model_df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    months_sorted = np.array(sorted(model_df["snapshot_month"].unique()))
    n_months = len(months_sorted)
    train_end = int(n_months * 0.70)
    valid_end = int(n_months * 0.85)
    train_months = months_sorted[:train_end]
    valid_months = months_sorted[train_end:valid_end]
    test_months = months_sorted[valid_end:]
    return (
        model_df[model_df["snapshot_month"].isin(train_months)].copy(),
        model_df[model_df["snapshot_month"].isin(valid_months)].copy(),
        model_df[model_df["snapshot_month"].isin(test_months)].copy(),
    )


def make_rf_pipeline() -> Pipeline:
    preprocess = ColumnTransformer(
        [
            ("num", Pipeline([("imputer", SimpleImputer(strategy="median"))]), FEATURE_COLS_NUM),
            (
                "cat",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("ohe", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                FEATURE_COLS_CAT,
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


def train_donor_high_value_rf(model_df: pd.DataFrame) -> tuple[Pipeline, list[str]]:
    train_df, _, _ = time_split_train(model_df)
    X = train_df[FEATURE_COLS]
    y = train_df[TARGET].astype(int)
    pipe = make_rf_pipeline()
    pipe.fit(X, y)
    return pipe, list(FEATURE_COLS)


def rows_for_snapshot_month(model_df: pd.DataFrame, as_of: str) -> pd.DataFrame:
    # Align with panel snapshot_month (month-end from training date_range freq="M").
    ts = pd.Timestamp(as_of[:10]).to_period("M").to_timestamp("M")
    subset = model_df[model_df["snapshot_month"] == ts]
    if subset.empty and not model_df.empty:
        # Requested month not in panel — fall back to latest available snapshot.
        latest = model_df["snapshot_month"].max()
        subset = model_df[model_df["snapshot_month"] == latest]
    return subset.copy()


def predict_high_value_proba(
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
                if c in FEATURE_COLS_CAT:
                    X[c] = X[c].astype(str)
            p = float(model.predict_proba(X)[0, 1])
            preds.append(p)
            errs.append(None)
        except Exception as ex:  # noqa: BLE001
            preds.append(float("nan"))
            errs.append(str(ex))
    return preds, errs
