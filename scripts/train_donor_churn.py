#!/usr/bin/env python3
"""Train donor churn RF pipeline from repo data/; write models/donor_churn_rf.joblib."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import joblib

_REPO_ROOT = Path(__file__).resolve().parents[1]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "ml_service"))

from ml_service.features.donor_churn import (  # noqa: E402
    build_training_panel,
    load_training_frames,
    train_donor_churn_rf,
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=None,
        help="Directory with supporters.csv and donations.csv (default: ./data or ../data)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=_REPO_ROOT / "models" / "donor_churn_rf.joblib",
        help="Output joblib path",
    )
    args = parser.parse_args()

    data_dir = args.data_dir
    if data_dir is None:
        if (_REPO_ROOT / "data").is_dir():
            data_dir = _REPO_ROOT / "data"
        else:
            raise SystemExit("Could not find data/. Pass --data-dir.")

    donations, supporters = load_training_frames(data_dir)
    panel = build_training_panel(donations, supporters)
    model = train_donor_churn_rf(panel, target="churn_90d")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, args.out)
    print("Wrote", args.out)


if __name__ == "__main__":
    main()
