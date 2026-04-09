#!/usr/bin/env python3
"""Train early-warning RF from repo data/; write models/early_warning_rf.joblib."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import joblib

_REPO_ROOT = Path(__file__).resolve().parents[1]
if str(_REPO_ROOT / "ml_service") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "ml_service"))

from ml_service.features.early_warning import (  # noqa: E402
    build_early_warning_model_df,
    train_early_warning_rf,
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, default=None)
    parser.add_argument(
        "--out",
        type=Path,
        default=_REPO_ROOT / "models" / "early_warning_rf.joblib",
    )
    args = parser.parse_args()

    data_dir = args.data_dir or (_REPO_ROOT / "data" if (_REPO_ROOT / "data").is_dir() else None)
    if data_dir is None:
        raise SystemExit("Could not find data/. Pass --data-dir.")

    df = build_early_warning_model_df(data_dir)
    pipe, feature_cols = train_early_warning_rf(df)
    bundle = {"pipeline": pipe, "feature_cols": feature_cols}

    args.out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, args.out)
    print("Wrote", args.out, "features:", len(feature_cols), "rows:", len(df))


if __name__ == "__main__":
    main()
