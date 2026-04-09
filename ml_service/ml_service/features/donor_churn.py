"""
Donor churn feature engineering — aligned with ml-pipelines/donor_churn_pipeline.ipynb.
Target for production RF: churn_90d, RandomForest chosen in notebook comparison.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

FEATURE_COLS = [
    "days_since_last_donation",
    "events_3m",
    "events_6m",
    "events_12m",
    "value_3m",
    "value_6m",
    "value_12m",
    "campaign_events_3m",
    "campaign_events_6m",
    "campaign_events_12m",
    "events_trend_3m_vs_prev3m",
    "value_trend_3m_vs_prev3m",
    "month_of_year",
    "quarter_of_year",
    "events_same_month_last_year",
    "gave_same_month_last_year",
    "active_month_concentration",
    "seasonal_supporter_flag",
    "acquisition_channel",
    "relationship_type",
    "region",
    "country",
    "supporter_type",
]
CAT_COLS = [
    "acquisition_channel",
    "relationship_type",
    "region",
    "country",
    "supporter_type",
    "month_of_year",
    "quarter_of_year",
    "seasonal_supporter_flag",
    "gave_same_month_last_year",
]
NUM_COLS = [c for c in FEATURE_COLS if c not in CAT_COLS]


def donor_churn_feature_cols() -> list[str]:
    return list(FEATURE_COLS)


def build_donor_churn_preprocess_template() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            (
                "num",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", StandardScaler()),
                    ]
                ),
                NUM_COLS,
            ),
            (
                "cat",
                Pipeline(
                    [
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("ohe", OneHotEncoder(handle_unknown="ignore")),
                    ]
                ),
                CAT_COLS,
            ),
        ]
    )


def make_donor_rf_pipeline() -> Pipeline:
    return Pipeline(
        [
            ("prep", build_donor_churn_preprocess_template()),
            (
                "model",
                RandomForestClassifier(
                    n_estimators=350,
                    max_depth=10,
                    min_samples_leaf=2,
                    class_weight="balanced",
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )


def _ensure_donation_columns(don_df: pd.DataFrame) -> pd.DataFrame:
    out = don_df.copy()
    if "donation_id" not in out.columns:
        out["donation_id"] = np.arange(len(out), dtype=np.int64)
    out["donation_date"] = pd.to_datetime(out["donation_date"], errors="coerce")
    if "estimated_value" not in out.columns and "amount" in out.columns:
        out["estimated_value"] = out["amount"].fillna(0.0)
    out["estimated_value"] = pd.to_numeric(out["estimated_value"], errors="coerce").fillna(0.0)
    out = out.dropna(subset=["supporter_id", "donation_date"])
    return out


def build_panel(don_df: pd.DataFrame, sup_df: pd.DataFrame, as_of: pd.Timestamp) -> pd.DataFrame:
    """Build supporter-month panel; extend calendar through `as_of` month (start)."""
    as_of = pd.Timestamp(as_of).normalize().replace(day=1)
    month_end = as_of + pd.offsets.MonthEnd(0)
    don_df = _ensure_donation_columns(don_df)
    don_df = don_df[don_df["donation_date"] <= pd.Timestamp(month_end)].copy()

    monthly = (
        don_df.assign(month=don_df["donation_date"].dt.to_period("M").dt.to_timestamp())
        .groupby(["supporter_id", "month"], as_index=False)
        .agg(
            donation_events=("donation_id", "count"),
            est_value_sum=("estimated_value", "sum"),
            n_campaign_events=("campaign_name", lambda s: s.notna().sum()),
        )
    )
    monthly["est_value_sum"] = monthly["est_value_sum"].fillna(0)

    if monthly.empty:
        first_m = as_of
        last_m = as_of
    else:
        first_m = monthly["month"].min()
        last_m = max(monthly["month"].max(), as_of)

    month_idx = pd.date_range(first_m, last_m, freq="MS")
    base = pd.MultiIndex.from_product(
        [sup_df["supporter_id"].unique(), month_idx], names=["supporter_id", "month"]
    ).to_frame(index=False)

    panel = base.merge(monthly, on=["supporter_id", "month"], how="left")
    panel[["donation_events", "est_value_sum", "n_campaign_events"]] = panel[
        ["donation_events", "est_value_sum", "n_campaign_events"]
    ].fillna(0)
    panel = panel.sort_values(["supporter_id", "month"]).reset_index(drop=True)

    panel = panel.merge(
        sup_df[
            [
                "supporter_id",
                "acquisition_channel",
                "relationship_type",
                "region",
                "country",
                "supporter_type",
            ]
        ],
        on="supporter_id",
        how="left",
    )

    panel["month_of_year"] = panel["month"].dt.month.astype(int)
    panel["quarter_of_year"] = panel["month"].dt.quarter.astype(int)

    if don_df.empty:
        panel["active_month_concentration"] = 0.0
        panel["seasonal_supporter_flag"] = 0
    else:
        month_counts = (
            don_df.assign(month_of_year=don_df["donation_date"].dt.month)
            .groupby(["supporter_id", "month_of_year"])
            .size()
            .rename("month_event_count")
            .reset_index()
        )
        seasonality = (
            month_counts.groupby("supporter_id")["month_event_count"]
            .agg(total_events="sum", peak_month_events="max")
            .reset_index()
        )
        seasonality["active_month_concentration"] = (
            seasonality["peak_month_events"] / seasonality["total_events"]
        ).fillna(0)
        seasonality["seasonal_supporter_flag"] = (seasonality["active_month_concentration"] >= 0.50).astype(
            int
        )
        panel = panel.merge(
            seasonality[["supporter_id", "active_month_concentration", "seasonal_supporter_flag"]],
            on="supporter_id",
            how="left",
        )
        panel[["active_month_concentration", "seasonal_supporter_flag"]] = panel[
            ["active_month_concentration", "seasonal_supporter_flag"]
        ].fillna(0)

    g = panel.groupby("supporter_id", group_keys=False)
    last_month = panel["month"].where(panel["donation_events"] > 0).groupby(panel["supporter_id"]).ffill()
    panel["days_since_last_donation"] = (panel["month"] - last_month).dt.days.fillna(9999)

    prev_year = panel[["supporter_id", "month", "donation_events"]].copy()
    prev_year["month"] = prev_year["month"] + pd.DateOffset(years=1)
    prev_year = prev_year.rename(columns={"donation_events": "events_same_month_last_year"})
    panel = panel.merge(prev_year, on=["supporter_id", "month"], how="left")
    panel["events_same_month_last_year"] = panel["events_same_month_last_year"].fillna(0)
    panel["gave_same_month_last_year"] = (panel["events_same_month_last_year"] > 0).astype(int)

    for w in [3, 6, 12]:
        panel[f"events_{w}m"] = (
            g["donation_events"]
            .shift(1)
            .rolling(w, min_periods=1)
            .sum()
            .reset_index(level=0, drop=True)
            .fillna(0)
        )
        panel[f"value_{w}m"] = (
            g["est_value_sum"]
            .shift(1)
            .rolling(w, min_periods=1)
            .sum()
            .reset_index(level=0, drop=True)
            .fillna(0)
        )
        panel[f"campaign_events_{w}m"] = (
            g["n_campaign_events"]
            .shift(1)
            .rolling(w, min_periods=1)
            .sum()
            .reset_index(level=0, drop=True)
            .fillna(0)
        )

    g2 = panel.groupby("supporter_id", group_keys=False)
    panel["events_trend_3m_vs_prev3m"] = panel["events_3m"] - g2["events_3m"].shift(3).fillna(0)
    panel["value_trend_3m_vs_prev3m"] = panel["value_3m"] - g2["value_3m"].shift(3).fillna(0)
    return panel


def add_label(panel_df: pd.DataFrame, don_df: pd.DataFrame, horizon_days: int) -> pd.DataFrame:
    don_df = _ensure_donation_columns(don_df)
    donor_dates = don_df.groupby("supporter_id")["donation_date"].apply(list).to_dict()
    out = panel_df.copy()

    def f(row):
        sid = int(row["supporter_id"])
        t0 = row["month"]
        t1 = t0 + pd.Timedelta(days=horizon_days)
        return int(not any((d > t0) and (d <= t1) for d in donor_dates.get(sid, [])))

    out[f"churn_{horizon_days}d"] = out.apply(f, axis=1)
    return out


def chrono_split(df: pd.DataFrame, target: str):
    mdf = df[["supporter_id", "month", target] + FEATURE_COLS].dropna().copy()
    cutoff = mdf["month"].quantile(0.8)
    tr = mdf[mdf["month"] <= cutoff]
    te = mdf[mdf["month"] > cutoff]
    return tr, te, tr[FEATURE_COLS], tr[target].astype(int), te[FEATURE_COLS], te[target].astype(int)


def load_training_frames(data_dir: Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    supporters = pd.read_csv(data_dir / "supporters.csv").drop_duplicates(subset=["supporter_id"])
    donations = pd.read_csv(data_dir / "donations.csv")
    donations = _ensure_donation_columns(donations)
    for c in CAT_COLS:
        if c in supporters.columns:
            supporters[c] = supporters[c].astype(str)
    return donations, supporters


def build_training_panel(donations: pd.DataFrame, supporters: pd.DataFrame) -> pd.DataFrame:
    panel = build_panel(donations, supporters, as_of=donations["donation_date"].max())
    panel = add_label(panel, donations, 90)
    panel = add_label(panel, donations, 180)
    panel = panel[panel["month"] >= (panel["month"].min() + pd.offsets.MonthBegin(3))]
    panel = panel[panel["month"] <= (panel["month"].max() - pd.offsets.MonthBegin(1))]
    for c in CAT_COLS:
        if c in panel.columns:
            panel[c] = panel[c].astype(str)
    return panel


def train_donor_churn_rf(panel: pd.DataFrame, target: str = "churn_90d") -> Pipeline:
    _, _, Xtr, ytr, _, _ = chrono_split(panel, target)
    model = make_donor_rf_pipeline()
    model.fit(Xtr, ytr)
    return model


def feature_row_for_supporter_at_date(
    supporter_row: dict,
    donation_rows: list[dict],
    as_of,
) -> pd.DataFrame:
    """Single-row feature matrix for sklearn predict."""
    as_of_ts = pd.Timestamp(as_of).normalize().replace(day=1)
    sup_df = pd.DataFrame([supporter_row])
    if "supporter_id" not in sup_df.columns:
        raise ValueError("supporter_id required")
    for col in ["acquisition_channel", "relationship_type", "region", "country", "supporter_type"]:
        if col in sup_df.columns:
            sup_df[col] = sup_df[col].astype(str)
    don_df = pd.DataFrame(donation_rows) if donation_rows else pd.DataFrame()
    if not don_df.empty:
        don_df = _ensure_donation_columns(don_df)
    panel = build_panel(don_df, sup_df, as_of_ts)
    sid = int(supporter_row["supporter_id"])
    row = panel[(panel["supporter_id"] == sid) & (panel["month"] == as_of_ts)]
    if row.empty:
        raise ValueError(f"No panel row for supporter {sid} at {as_of_ts.date()}")
    for c in CAT_COLS:
        if c in row.columns:
            row = row.copy()
            row[c] = row[c].astype(str)
    return row[FEATURE_COLS]


def churn_tier_from_probability(p: float, high_threshold: float = 0.5) -> tuple[str, str]:
    """Returns (tier, recommended_action)."""
    low_top = max(0.0, high_threshold - 0.10)
    if p >= high_threshold:
        return (
            "High",
            "Personalized outreach within 7 days (thank-you + impact update + tailored ask).",
        )
    if p >= low_top:
        return ("Medium", "Add to monthly nurture sequence; light personalization.")
    return ("Low", "Maintain routine stewardship; no urgent churn intervention.")
