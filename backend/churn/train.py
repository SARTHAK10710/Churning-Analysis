"""Train every candidate model, evaluate it on the hold-out set and save artifacts.

Run from the ``backend`` folder:

    python -m churn.train

Writes ``artifacts/model.joblib`` (the deployed Gradient Boosting pipeline plus a
background sample used for explanations) and ``artifacts/metrics.json``.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import sklearn
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

from .features import ENCODED, FEATURE_LABELS, FEATURES, TARGET, ChurnEncoder, load_dataset

ARTIFACTS_DIR = Path(__file__).resolve().parents[1] / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.joblib"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"

MODEL_VERSION = "1.0.0"
RANDOM_STATE = 42
TEST_SIZE = 0.2
DEPLOYED_KEY = "gradient_boosting"

# key -> (display name, estimator, short description)
CANDIDATES = {
    "baseline": (
        'Baseline (always "stay")',
        DummyClassifier(strategy="most_frequent"),
        "Predicts that nobody leaves. The bar every model must beat.",
    ),
    "logistic_regression": (
        "Logistic Regression",
        LogisticRegression(max_iter=1000),
        "Linear model. Interpretable weights, but misses feature interactions.",
    ),
    "knn": (
        "K-Nearest Neighbours (k=5)",
        KNeighborsClassifier(n_neighbors=5),
        "Votes using the 5 most similar customers.",
    ),
    "random_forest": (
        "Random Forest",
        RandomForestClassifier(n_estimators=100, max_depth=5, random_state=RANDOM_STATE),
        "100 depth-limited trees voting together.",
    ),
    "svm": (
        "SVM (RBF kernel)",
        SVC(kernel="rbf", random_state=RANDOM_STATE),
        "Curved maximum-margin boundary between the classes.",
    ),
    "decision_tree": (
        "Decision Tree (depth 5)",
        DecisionTreeClassifier(max_depth=5, random_state=RANDOM_STATE),
        "Readable if/else rules, limited depth to avoid overfitting.",
    ),
    DEPLOYED_KEY: (
        "Gradient Boosting",
        GradientBoostingClassifier(n_estimators=100, random_state=RANDOM_STATE),
        "100 shallow trees, each correcting the previous ones. Deployed model.",
    ),
}


def build_pipeline(estimator) -> Pipeline:
    return Pipeline(
        [
            ("encode", ChurnEncoder()),
            ("scale", StandardScaler()),
            ("model", estimator),
        ]
    )


def _scores(pipe: Pipeline, X):
    """Continuous scores for ROC-AUC: probabilities when available, else margins."""
    if hasattr(pipe, "predict_proba"):
        try:
            return pipe.predict_proba(X)[:, 1]
        except AttributeError:
            pass
    return pipe.decision_function(X)


def evaluate(pipe: Pipeline, X, y) -> dict:
    pred = pipe.predict(X)
    return {
        "accuracy": float(accuracy_score(y, pred)),
        "precision": float(precision_score(y, pred, zero_division=0)),
        "recall": float(recall_score(y, pred)),
        "f1": float(f1_score(y, pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y, _scores(pipe, X))),
    }


def train() -> dict:
    df = load_dataset()
    X, y = df[FEATURES], df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )

    models, pipelines = [], {}
    for key, (name, estimator, description) in CANDIDATES.items():
        pipe = build_pipeline(estimator).fit(X_train, y_train)
        pipelines[key] = pipe
        models.append(
            {
                "key": key,
                "name": name,
                "description": description,
                "deployed": key == DEPLOYED_KEY,
                **evaluate(pipe, X_test, y_test),
            }
        )
        print(f"{name:32s} acc={models[-1]['accuracy']:.3f} recall={models[-1]['recall']:.3f}")

    deployed = pipelines[DEPLOYED_KEY]
    tn, fp, fn, tp = confusion_matrix(y_test, deployed.predict(X_test)).ravel()
    importances = deployed.named_steps["model"].feature_importances_
    order = np.argsort(importances)[::-1]

    trained_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    metrics = {
        "version": MODEL_VERSION,
        "trained_at": trained_at,
        "sklearn_version": sklearn.__version__,
        "deployed": DEPLOYED_KEY,
        "threshold": 0.5,
        "split": {
            "train": int(len(X_train)),
            "test": int(len(X_test)),
            "test_size": TEST_SIZE,
            "random_state": RANDOM_STATE,
            "test_churn_rate": float(y_test.mean()),
        },
        "models": models,
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "feature_importance": [
            {
                "feature": ENCODED[i],
                "label": FEATURE_LABELS[ENCODED[i]],
                "importance": float(importances[i]),
            }
            for i in order
        ],
    }

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "pipeline": deployed,
            # Background sample for the per-prediction explanation.
            "background": X_train.sample(200, random_state=RANDOM_STATE).reset_index(drop=True),
            "baseline_rate": float(y_train.mean()),
            "version": MODEL_VERSION,
            "trained_at": trained_at,
            "n_train": int(len(X_train)),
        },
        MODEL_PATH,
    )
    METRICS_PATH.write_text(json.dumps(metrics, indent=2))
    print(f"Saved {MODEL_PATH.name} and {METRICS_PATH.name} to {ARTIFACTS_DIR}")
    return metrics


if __name__ == "__main__":
    train()
