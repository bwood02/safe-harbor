"""
Safe Harbor ML inference API.
Run from repo root: uvicorn ml_api.main:app --host 0.0.0.0 --port 8010
(Set PYTHONPATH to repo root, or run from ml_api with adjusted imports.)
"""

from __future__ import annotations

import logging
import os
import sys
import time
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

_REPO_ROOT = Path(__file__).resolve().parents[1]
if str(_REPO_ROOT / "ml_service") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "ml_service"))

import joblib  # noqa: E402
import numpy as np  # noqa: E402
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor  # noqa: E402
from sklearn.pipeline import Pipeline  # noqa: E402

from ml_service.features.donor_churn import (  # noqa: E402
    churn_tier_from_probability,
    feature_row_for_supporter_at_date,
)
from ml_service.features.donor_high_value import (  # noqa: E402
    build_donor_high_value_model_df_from_payload,
    predict_high_value_proba,
    rows_for_snapshot_month,
)
from ml_service.features.early_warning import (  # noqa: E402
    build_early_warning_model_df_from_payload,
    predict_early_warning_proba,
    rows_for_month as ew_rows_for_month,
)
from ml_service.features.reintegration_readiness import (  # noqa: E402
    build_reintegration_model_df_from_payload,
    predict_reintegration_proba,
    rows_for_month as reint_rows_for_month,
)
from ml_service.features.resident_wellbeing import (  # noqa: E402
    build_master_from_api_payload,
    predict_wellbeing_next,
    rows_for_month,
)
from ml_service.features.social_engagement import (  # noqa: E402
    build_social_engagement_from_payload,
    predict_social_next,
    row_for_month as social_row_for_month,
)

MODELS_DIR = Path(os.environ.get("MODELS_DIR", _REPO_ROOT / "models"))
ML_API_KEY = os.environ.get("ML_API_KEY", "").strip()
MODEL_SOURCE = os.environ.get("MODEL_SOURCE", "local").strip().lower()
AZURE_STORAGE_CONNECTION_STRING = os.environ.get("AZURE_STORAGE_CONNECTION_STRING", "").strip()
AZURE_BLOB_CONTAINER = os.environ.get("AZURE_BLOB_CONTAINER", "ml-models").strip()
AZURE_BLOB_PREFIX = os.environ.get("AZURE_BLOB_PREFIX", "models/latest").strip().strip("/")

app = FastAPI(title="Safe Harbor ML API", version="0.1.0")

_models: dict[str, object] = {}
_bundle_feature_cols: dict[str, list[str]] = {}
_model_versions: dict[str, str] = {}
logger = logging.getLogger("safe_harbor.ml_api")

_STUB_PIPELINE_KEYS = frozenset(
    {"donor_high_value", "early_warning", "reintegration", "social_engagement"}
)


@app.middleware("http")
async def log_request_timing(request, call_next):  # type: ignore[no-untyped-def]
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000.0
    logger.info("%s %s -> %s (%.1fms)", request.method, request.url.path, response.status_code, elapsed_ms)
    return response


def _is_stub_model(key: str) -> bool:
    return _bundle_feature_cols.get(key) == ["stub_feature"]


def _require_api_key(x_ml_api_key: str | None) -> None:
    if not ML_API_KEY:
        return
    if not x_ml_api_key or x_ml_api_key != ML_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing X-ML-API-Key")


def _load_joblib(name: str, filename: str) -> bool:
    path = MODELS_DIR / filename
    if not path.is_file():
        return False
    try:
        raw = joblib.load(path)
        if isinstance(raw, dict) and "pipeline" in raw:
            _models[name] = raw["pipeline"]
            fc = raw.get("feature_cols")
            if isinstance(fc, list):
                _bundle_feature_cols[name] = fc
        else:
            _models[name] = raw
        mtime = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(path.stat().st_mtime))
        _model_versions[name] = f"{filename}:{mtime}"
        return True
    except Exception:
        return False


def _inject_stub_pipeline(key: str) -> None:
    """Minimal fitted model so /models shows loaded until real joblib exists."""
    rng = np.random.default_rng(42)
    x = rng.random((8, 1))
    y = rng.random(8)
    if key == "social_engagement":
        pipe: Pipeline = Pipeline(
            [
                (
                    "model",
                    RandomForestRegressor(
                        n_estimators=5,
                        max_depth=3,
                        random_state=42,
                    ),
                )
            ]
        )
    else:
        y_cls = np.array([0, 1, 0, 1, 0, 1, 0, 1])
        pipe = Pipeline(
            [
                (
                    "model",
                    RandomForestClassifier(
                        n_estimators=5,
                        max_depth=3,
                        random_state=42,
                    ),
                )
            ]
        )
        pipe.fit(x, y_cls)
        _models[key] = pipe
        _bundle_feature_cols[key] = ["stub_feature"]
        return

    pipe.fit(x, y)
    _models[key] = pipe
    _bundle_feature_cols[key] = ["stub_feature"]
    _model_versions[key] = "stub"


def _sync_models_from_blob() -> None:
    """
    Optional production path: download latest model artifacts from Azure Blob
    to MODELS_DIR before loading.
    """
    if MODEL_SOURCE != "blob":
        return
    if not AZURE_STORAGE_CONNECTION_STRING:
        logger.warning("MODEL_SOURCE=blob but AZURE_STORAGE_CONNECTION_STRING is not set; skipping blob sync")
        return
    try:
        from azure.storage.blob import BlobServiceClient
    except Exception:  # noqa: BLE001
        logger.warning("azure-storage-blob is not installed; skipping blob sync")
        return

    wanted = [
        "donor_churn_rf.joblib",
        "donor_high_value_rf.joblib",
        "resident_wellbeing_rf.joblib",
        "early_warning_rf.joblib",
        "reintegration_rf.joblib",
        "social_engagement_rf.joblib",
    ]
    base = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
    container = base.get_container_client(AZURE_BLOB_CONTAINER)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    for filename in wanted:
        blob_name = f"{AZURE_BLOB_PREFIX}/{filename}"
        try:
            data = container.download_blob(blob_name).readall()
            (MODELS_DIR / filename).write_bytes(data)
            logger.info("Downloaded model artifact: %s", blob_name)
        except Exception as ex:  # noqa: BLE001
            logger.info("Model artifact not downloaded (%s): %s", blob_name, ex)


@app.on_event("startup")
def startup() -> None:
    _sync_models_from_blob()
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    _load_joblib("donor_churn", "donor_churn_rf.joblib")
    for key, fn in [
        ("donor_high_value", "donor_high_value_rf.joblib"),
        ("resident_wellbeing", "resident_wellbeing_rf.joblib"),
        ("early_warning", "early_warning_rf.joblib"),
        ("reintegration", "reintegration_rf.joblib"),
        ("social_engagement", "social_engagement_rf.joblib"),
    ]:
        _load_joblib(key, fn)
    for key in _STUB_PIPELINE_KEYS:
        if key not in _models:
            _inject_stub_pipeline(key)


def _model_status() -> dict[str, bool]:
    expected = (
        "donor_churn",
        "donor_high_value",
        "resident_wellbeing",
        "early_warning",
        "reintegration",
        "social_engagement",
    )
    return {k: k in _models for k in expected}


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "models_dir": str(MODELS_DIR.resolve())}


@app.get("/models")
def models() -> dict:
    return {"loaded": list(_models.keys()), "status": _model_status(), "versions": _model_versions}


# --- donor churn ---


class DonationIn(BaseModel):
    supporter_id: int
    donation_date: str = Field(description="ISO date YYYY-MM-DD")
    estimated_value: float = 0.0
    campaign_name: str | None = None


class SupporterIn(BaseModel):
    supporter_id: int
    acquisition_channel: str = ""
    relationship_type: str = ""
    region: str = ""
    country: str = ""
    supporter_type: str = ""


class DonorChurnBatchRequest(BaseModel):
    as_of: str = Field(description="ISO date; features computed for that month start")
    supporters: list[SupporterIn]
    donations: list[DonationIn]


class DonorChurnScore(BaseModel):
    supporter_id: int
    churn_probability: float
    tier: str
    recommended_action: str
    error: str | None = None


@app.post("/predict/donor-churn", response_model=list[DonorChurnScore])
def predict_donor_churn(
    body: DonorChurnBatchRequest,
    x_ml_api_key: str | None = Header(default=None, alias="X-ML-API-Key"),
) -> list[DonorChurnScore]:
    _require_api_key(x_ml_api_key)
    if "donor_churn" not in _models:
        raise HTTPException(status_code=503, detail="donor_churn_rf.joblib not loaded")
    model = _models["donor_churn"]
    as_of = body.as_of[:10]
    don_rows = [d.model_dump() for d in body.donations]
    out: list[DonorChurnScore] = []
    for s in body.supporters:
        sid = s.supporter_id
        try:
            sup_dict = s.model_dump()
            sub_don = [r for r in don_rows if r["supporter_id"] == sid]
            X = feature_row_for_supporter_at_date(sup_dict, sub_don, as_of)
            p = float(model.predict_proba(X)[0, 1])
            tier, action = churn_tier_from_probability(p)
            out.append(
                DonorChurnScore(
                    supporter_id=sid,
                    churn_probability=p,
                    tier=tier,
                    recommended_action=action,
                    error=None,
                )
            )
        except Exception as ex:  # noqa: BLE001
            out.append(
                DonorChurnScore(
                    supporter_id=sid,
                    churn_probability=0.0,
                    tier="Unknown",
                    recommended_action="",
                    error=str(ex),
                )
            )
    return out


# --- donor high value ---


class DonorHighValueRequest(BaseModel):
    as_of: str = Field(description="Snapshot month ISO date (YYYY-MM-DD)")
    supporters: list[dict] = []
    donations: list[dict] = []
    donation_allocations: list[dict] = []


class DonorHighValueScore(BaseModel):
    supporter_id: int
    high_value_probability: float
    error: str | None = None


@app.post("/predict/donor-high-value", response_model=list[DonorHighValueScore])
def predict_high_value(
    body: DonorHighValueRequest,
    x_ml_api_key: str | None = Header(default=None, alias="X-ML-API-Key"),
) -> list[DonorHighValueScore]:
    _require_api_key(x_ml_api_key)
    if "donor_high_value" not in _models:
        raise HTTPException(status_code=503, detail="donor_high_value_rf.joblib not loaded")
    if _is_stub_model("donor_high_value"):
        return [
            DonorHighValueScore(
                supporter_id=0,
                high_value_probability=0.0,
                error="Stub model — train with scripts/train_donor_high_value.py and add models/donor_high_value_rf.joblib",
            )
        ]
    model = _models["donor_high_value"]
    feats = _bundle_feature_cols.get("donor_high_value")
    if not feats:
        raise HTTPException(status_code=503, detail="donor_high_value bundle missing feature_cols")
    payload = body.model_dump()
    try:
        df = build_donor_high_value_model_df_from_payload(payload)
        month_df = rows_for_snapshot_month(df, body.as_of[:10])
    except Exception as ex:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(ex)) from ex
    if month_df.empty:
        return []
    rows_dicts = month_df[feats].to_dict("records")
    preds, errs = predict_high_value_proba(model, feats, rows_dicts)
    out: list[DonorHighValueScore] = []
    for i, (_, row) in enumerate(month_df.iterrows()):
        out.append(
            DonorHighValueScore(
                supporter_id=int(row["supporter_id"]),
                high_value_probability=float(preds[i]),
                error=errs[i],
            )
        )
    return out


# --- resident wellbeing ---


class ResidentWellbeingRequest(BaseModel):
    """Raw table rows (CSV-shaped dicts) — same join logic as training."""

    as_of: str = Field(description="Feature month as ISO date (YYYY-MM-DD, first of month)")
    health_wellbeing_records: list[dict] = []
    process_recordings: list[dict] = []
    home_visitations: list[dict] = []
    education_records: list[dict] = []
    incident_reports: list[dict] = []
    intervention_plans: list[dict] = []
    residents: list[dict] = []
    safehouses: list[dict] = []


class ResidentWellbeingScore(BaseModel):
    resident_id: int
    predicted_wellbeing_next: float
    wellbeing_lag: float
    error: str | None = None


@app.post("/predict/resident-wellbeing", response_model=list[ResidentWellbeingScore])
def predict_wellbeing(
    body: ResidentWellbeingRequest,
    x_ml_api_key: str | None = Header(default=None, alias="X-ML-API-Key"),
) -> list[ResidentWellbeingScore]:
    _require_api_key(x_ml_api_key)
    if "resident_wellbeing" not in _models:
        raise HTTPException(status_code=503, detail="Model not trained — add resident_wellbeing_rf.joblib")
    feats = _bundle_feature_cols.get("resident_wellbeing")
    if not feats:
        raise HTTPException(status_code=503, detail="resident_wellbeing bundle missing feature_cols")
    model = _models["resident_wellbeing"]
    payload = body.model_dump()
    try:
        df = build_master_from_api_payload(payload)
        month_df = rows_for_month(df, body.as_of[:10])
    except Exception as ex:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(ex)) from ex
    if month_df.empty:
        return []
    rows_dicts = month_df[feats].to_dict("records")
    preds, errs = predict_wellbeing_next(model, feats, rows_dicts)
    out: list[ResidentWellbeingScore] = []
    for i, (_, row) in enumerate(month_df.iterrows()):
        out.append(
            ResidentWellbeingScore(
                resident_id=int(row["resident_id"]),
                predicted_wellbeing_next=float(preds[i]),
                wellbeing_lag=float(row["wellbeing_lag"]),
                error=errs[i],
            )
        )
    return out


# --- early warning & reintegration (same caseload payload) ---


class CaseloadMonthRequest(BaseModel):
    as_of: str
    health_wellbeing_records: list[dict] = []
    process_recordings: list[dict] = []
    home_visitations: list[dict] = []
    education_records: list[dict] = []
    incident_reports: list[dict] = []
    intervention_plans: list[dict] = []
    residents: list[dict] = []
    safehouses: list[dict] = []


class EarlyWarningScore(BaseModel):
    resident_id: int
    struggle_probability: float
    error: str | None = None


@app.post("/predict/early-warning", response_model=list[EarlyWarningScore])
def predict_early_warning(
    body: CaseloadMonthRequest,
    x_ml_api_key: str | None = Header(default=None, alias="X-ML-API-Key"),
) -> list[EarlyWarningScore]:
    _require_api_key(x_ml_api_key)
    if "early_warning" not in _models:
        raise HTTPException(status_code=503, detail="early_warning_rf.joblib not loaded")
    if _is_stub_model("early_warning"):
        return [
            EarlyWarningScore(
                resident_id=0,
                struggle_probability=0.0,
                error="Stub model — train with scripts/train_early_warning.py",
            )
        ]
    model = _models["early_warning"]
    feats = _bundle_feature_cols.get("early_warning")
    if not feats:
        raise HTTPException(status_code=503, detail="early_warning bundle missing feature_cols")
    payload = body.model_dump()
    try:
        df = build_early_warning_model_df_from_payload(payload)
        month_df = ew_rows_for_month(df, body.as_of[:10])
    except Exception as ex:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(ex)) from ex
    if month_df.empty:
        return []
    rows_dicts = month_df[feats].to_dict("records")
    preds, errs = predict_early_warning_proba(model, feats, rows_dicts)
    out: list[EarlyWarningScore] = []
    for i, (_, row) in enumerate(month_df.iterrows()):
        out.append(
            EarlyWarningScore(
                resident_id=int(row["resident_id"]),
                struggle_probability=float(preds[i]),
                error=errs[i],
            )
        )
    return out


class ReintegrationScore(BaseModel):
    resident_id: int
    readiness_probability: float
    error: str | None = None


@app.post("/predict/reintegration-readiness", response_model=list[ReintegrationScore])
def predict_reintegration(
    body: CaseloadMonthRequest,
    x_ml_api_key: str | None = Header(default=None, alias="X-ML-API-Key"),
) -> list[ReintegrationScore]:
    _require_api_key(x_ml_api_key)
    if "reintegration" not in _models:
        raise HTTPException(status_code=503, detail="reintegration_rf.joblib not loaded")
    if _is_stub_model("reintegration"):
        return [
            ReintegrationScore(
                resident_id=0,
                readiness_probability=0.0,
                error="Stub model — train with scripts/train_reintegration_readiness.py",
            )
        ]
    model = _models["reintegration"]
    feats = _bundle_feature_cols.get("reintegration")
    if not feats:
        raise HTTPException(status_code=503, detail="reintegration bundle missing feature_cols")
    payload = body.model_dump()
    try:
        df = build_reintegration_model_df_from_payload(payload)
        month_df = reint_rows_for_month(df, body.as_of[:10])
    except Exception as ex:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(ex)) from ex
    if month_df.empty:
        return []
    rows_dicts = month_df[feats].to_dict("records")
    preds, errs = predict_reintegration_proba(model, feats, rows_dicts)
    out: list[ReintegrationScore] = []
    for i, (_, row) in enumerate(month_df.iterrows()):
        out.append(
            ReintegrationScore(
                resident_id=int(row["resident_id"]),
                readiness_probability=float(preds[i]),
                error=errs[i],
            )
        )
    return out


# --- social engagement ---


class SocialEngagementRequest(BaseModel):
    as_of: str
    social_media_posts: list[dict] = []
    donations: list[dict] = []


class SocialEngagementScore(BaseModel):
    month: str
    predicted_next_monetary: float
    error: str | None = None


@app.post("/predict/social-engagement-donations", response_model=list[SocialEngagementScore])
def predict_social(
    body: SocialEngagementRequest,
    x_ml_api_key: str | None = Header(default=None, alias="X-ML-API-Key"),
) -> list[SocialEngagementScore]:
    _require_api_key(x_ml_api_key)
    if "social_engagement" not in _models:
        raise HTTPException(status_code=503, detail="social_engagement_rf.joblib not loaded")
    if _is_stub_model("social_engagement"):
        return [
            SocialEngagementScore(
                month=body.as_of[:10],
                predicted_next_monetary=0.0,
                error="Stub model — train with scripts/train_social_engagement.py",
            )
        ]
    model = _models["social_engagement"]
    feats = _bundle_feature_cols.get("social_engagement")
    if not feats:
        raise HTTPException(status_code=503, detail="social_engagement bundle missing feature_cols")
    payload = body.model_dump()
    try:
        panel = build_social_engagement_from_payload(payload)
        month_df = social_row_for_month(panel, body.as_of[:10])
    except Exception as ex:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(ex)) from ex
    if month_df.empty:
        return []
    rows_dicts = month_df[feats].to_dict("records")
    preds, errs = predict_social_next(model, feats, rows_dicts)
    out: list[SocialEngagementScore] = []
    for i, (_, row) in enumerate(month_df.iterrows()):
        m = row["month"]
        month_s = m.isoformat()[:10] if hasattr(m, "isoformat") else str(m)[:10]
        out.append(
            SocialEngagementScore(
                month=month_s,
                predicted_next_monetary=float(preds[i]),
                error=errs[i],
            )
        )
    return out
