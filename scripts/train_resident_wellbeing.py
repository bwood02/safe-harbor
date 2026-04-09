#!/usr/bin/env python3
"""Train resident wellbeing RF from repo data/; write models/resident_wellbeing_rf.joblib."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import joblib

_REPO_ROOT = Path(__file__).resolve().parents[1]
if str(_REPO_ROOT / "ml_service") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "ml_service"))

from ml_service.features.resident_wellbeing import (  # noqa: E402
    build_master_dataframe,
    train_resident_wellbeing_rf,
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=None,
        help="Directory with CSVs (default: ./data)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=_REPO_ROOT / "models" / "resident_wellbeing_rf.joblib",
        help="Output joblib path",
    )
    args = parser.parse_args()

    data_dir = args.data_dir
    if data_dir is None:
        if (_REPO_ROOT / "data").is_dir():
            data_dir = _REPO_ROOT / "data"
        else:
            raise SystemExit("Could not find data/. Pass --data-dir.")

    df = build_master_dataframe(data_dir)
    model, feature_cols = train_resident_wellbeing_rf(df)
    bundle = {"pipeline": model, "feature_cols": feature_cols}

    args.out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, args.out)
    print("Wrote", args.out, "features:", len(feature_cols))


if __name__ == "__main__":
    main()
