#!/usr/bin/env python3
"""Train social→donations RF from repo data/; write models/social_engagement_rf.joblib."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import joblib

_REPO_ROOT = Path(__file__).resolve().parents[1]
if str(_REPO_ROOT / "ml_service") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "ml_service"))

from ml_service.features.social_engagement import (  # noqa: E402
    build_social_engagement_model_df_from_dir,
    train_social_engagement_rf,
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, default=None)
    parser.add_argument(
        "--out",
        type=Path,
        default=_REPO_ROOT / "models" / "social_engagement_rf.joblib",
    )
    args = parser.parse_args()

    data_dir = args.data_dir or (_REPO_ROOT / "data" if (_REPO_ROOT / "data").is_dir() else None)
    if data_dir is None:
        raise SystemExit("Could not find data/. Pass --data-dir.")

    panel = build_social_engagement_model_df_from_dir(data_dir)
    pipe, feature_cols = train_social_engagement_rf(panel)
    bundle = {"pipeline": pipe, "feature_cols": feature_cols}

    args.out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, args.out)
    print("Wrote", args.out, "features:", len(feature_cols), "rows:", len(panel))


if __name__ == "__main__":
    main()
