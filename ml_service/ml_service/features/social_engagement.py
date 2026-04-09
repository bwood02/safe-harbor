"""
Social engagement → next-month donations — aligned with ml-pipelines/social_media_engagement_to_donations.ipynb.
Target: y_next_monetary_amount (regression).
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

TARGET = "y_next_monetary_amount"
RANDOM_STATE = 42

LEAKY_OR_OUTCOME = {"y_monetary_amount", "y_estimated_value", "n_donation_events"}


def _prep_social(social: pd.DataFrame) -> pd.DataFrame:
    x = social.copy()
    x["created_at"] = pd.to_datetime(x["created_at"], errors="coerce")
    x["month"] = x["created_at"].dt.to_period("M").dt.to_timestamp()
    for c in ["likes", "comments", "shares", "forwards", "click_throughs", "boost_budget_php", "engagement_rate"]:
        if c in x.columns:
            x[c] = pd.to_numeric(x[c], errors="coerce").fillna(0)
    x["is_boosted"] = x["is_boosted"].map(lambda v: str(v).lower() in ("true", "1", "yes")) if "is_boosted" in x.columns else False
    x["has_call_to_action"] = x["has_call_to_action"].map(lambda v: str(v).lower() in ("true", "1", "yes")) if "has_call_to_action" in x.columns else False
    return x


def _prep_donations(donations: pd.DataFrame) -> pd.DataFrame:
    d = donations.copy()
    d["donation_date"] = pd.to_datetime(d["donation_date"], errors="coerce")
    d["month"] = d["donation_date"].dt.to_period("M").dt.to_timestamp()
    d["amount"] = pd.to_numeric(d["amount"], errors="coerce").fillna(0)
    if "estimated_value" in d.columns:
        d["estimated_value"] = pd.to_numeric(d["estimated_value"], errors="coerce").fillna(0)
    else:
        d["estimated_value"] = 0.0
    return d


def build_org_month_features(df: pd.DataFrame) -> pd.DataFrame:
    x = df.copy()
    x["is_weekend"] = x["day_of_week"].isin(["Saturday", "Sunday"]).astype(int)
    x["is_peak_hour"] = x["post_hour"].between(18, 22, inclusive="both").astype(int)

    base = x.groupby("month", as_index=False).agg(
        posts=("post_id", "count"),
        boosted_posts=("is_boosted", "sum"),
        boost_budget_php=("boost_budget_php", "sum"),
        likes=("likes", "sum"),
        comments=("comments", "sum"),
        shares=("shares", "sum"),
        forwards=("forwards", "sum"),
        click_throughs=("click_throughs", "sum"),
        avg_engagement_rate=("engagement_rate", "mean"),
        cta_rate=("has_call_to_action", "mean"),
        weekend_post_rate=("is_weekend", "mean"),
        peak_hour_post_rate=("is_peak_hour", "mean"),
    )

    post_mix = pd.crosstab(x["month"], x["post_type"], normalize="index").add_prefix("post_type_share_").reset_index()
    media_mix = pd.crosstab(x["month"], x["media_type"], normalize="index").add_prefix("media_share_").reset_index()
    topic_mix = pd.crosstab(x["month"], x["content_topic"], normalize="index").add_prefix("topic_share_").reset_index()

    out = base.merge(post_mix, on="month", how="left").merge(media_mix, on="month", how="left").merge(topic_mix, on="month", how="left")
    return out.fillna(0)


def build_targets(df: pd.DataFrame) -> pd.DataFrame:
    return df.groupby("month", as_index=False).agg(
        y_monetary_amount=("amount", "sum"),
        y_estimated_value=("estimated_value", "sum"),
        n_donation_events=("donation_id", "count"),
    )


def build_social_engagement_model_df(social: pd.DataFrame, donations: pd.DataFrame) -> pd.DataFrame:
    social = _prep_social(social)
    donations = _prep_donations(donations)
    org_feats = build_org_month_features(social)
    org_targets = build_targets(donations)
    panel = org_feats.merge(org_targets, on="month", how="left").sort_values("month").reset_index(drop=True)
    panel["y_next_monetary_amount"] = panel["y_monetary_amount"].shift(-1)
    panel["y_next_estimated_value"] = panel["y_estimated_value"].shift(-1)
    panel["prev_monetary_amount"] = panel["y_monetary_amount"].shift(1)
    panel["prev_estimated_value"] = panel["y_estimated_value"].shift(1)
    panel["month_num"] = panel["month"].dt.month.astype(int)
    panel["year_num"] = panel["month"].dt.year.astype(int)
    panel_model = panel.dropna(subset=["y_next_monetary_amount", "y_next_estimated_value"]).copy()
    return panel_model


def build_social_engagement_model_df_from_dir(data_dir: Path) -> pd.DataFrame:
    social = pd.read_csv(data_dir / "social_media_posts.csv")
    donations = pd.read_csv(data_dir / "donations.csv")
    return build_social_engagement_model_df(social, donations)


def feature_columns(panel_model: pd.DataFrame) -> list[str]:
    cols = [
        c
        for c in panel_model.columns
        if c
        not in {"month", "y_next_monetary_amount", "y_next_estimated_value", *LEAKY_OR_OUTCOME}
    ]
    return cols


def time_split_train(panel_model: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    months = sorted(panel_model["month"].unique())
    cut = max(1, int(len(months) * 0.8))
    train_m = set(months[:cut])
    test_m = set(months[cut:])
    train_df = panel_model[panel_model["month"].isin(train_m)].copy()
    test_df = panel_model[panel_model["month"].isin(test_m)].copy()
    return train_df, test_df


def make_rf_pipeline(numeric_cols: list[str], categorical_cols: list[str]) -> Pipeline:
    preprocess = ColumnTransformer(
        [
            ("num", Pipeline([("imputer", SimpleImputer(strategy="median"))]), numeric_cols),
            (
                "cat",
                Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("ohe", OneHotEncoder(handle_unknown="ignore"))]),
                categorical_cols,
            ),
        ]
    )
    return Pipeline(
        [
            ("prep", preprocess),
            (
                "model",
                RandomForestRegressor(
                    n_estimators=350,
                    max_depth=8,
                    min_samples_leaf=2,
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                ),
            ),
        ]
    )


def train_social_engagement_rf(panel_model: pd.DataFrame) -> tuple[Pipeline, list[str]]:
    train_df, _ = time_split_train(panel_model)
    feats = feature_columns(panel_model)
    X = train_df[feats]
    y = train_df[TARGET]
    numeric_cols = [c for c in feats if pd.api.types.is_numeric_dtype(panel_model[c])]
    categorical_cols = [c for c in feats if c not in numeric_cols]
    pipe = make_rf_pipeline(numeric_cols, categorical_cols)
    pipe.fit(X, y)
    return pipe, feats


def build_social_engagement_from_payload(payload: dict[str, Any]) -> pd.DataFrame:
    social = pd.DataFrame(payload.get("social_media_posts") or [])
    donations = pd.DataFrame(payload.get("donations") or [])
    return build_social_engagement_model_df(social, donations)


def row_for_month(panel_model: pd.DataFrame, as_of: str) -> pd.DataFrame:
    ym = pd.Timestamp(as_of[:10]).to_period("M").to_timestamp()
    return panel_model[panel_model["month"] == ym].copy()


def predict_social_next(
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
            p = float(model.predict(X)[0])
            preds.append(p)
            errs.append(None)
        except Exception as ex:  # noqa: BLE001
            preds.append(float("nan"))
            errs.append(str(ex))
    return preds, errs
