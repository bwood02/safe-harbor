#!/usr/bin/env python3
"""Train high-value donor RF from repo data/; write models/donor_high_value_rf.joblib (pipeline + feature_cols)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import joblib

_REPO_ROOT = Path(__file__).resolve().parents[1]
if str(_REPO_ROOT / "ml_service") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "ml_service"))

from ml_service.features.donor_high_value import (  # noqa: E402
    build_donor_high_value_model_df,
    train_donor_high_value_rf,
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=None,
        help="Directory with supporters.csv, donations.csv, donation_allocations.csv",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=_REPO_ROOT / "models" / "donor_high_value_rf.joblib",
    )
    args = parser.parse_args()

    data_dir = args.data_dir
    if data_dir is None:
        if (_REPO_ROOT / "data").is_dir():
            data_dir = _REPO_ROOT / "data"
        else:
            raise SystemExit("Could not find data/. Pass --data-dir.")

    df = build_donor_high_value_model_df(data_dir)
    pipe, feature_cols = train_donor_high_value_rf(df)
    bundle = {"pipeline": pipe, "feature_cols": feature_cols}

    args.out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, args.out)
    print("Wrote", args.out, "features:", len(feature_cols))


if __name__ == "__main__":
    main()
