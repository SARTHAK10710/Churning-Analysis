"""ChurnLens API: serves the churn model, its metrics and dataset insights.

Run from the ``backend`` folder:

    uvicorn api.main:app --reload --port 8000
"""

import io
import json
import os
import time
from contextlib import asynccontextmanager

import joblib
import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from churn.explain import (
    AGE_BINS,
    AGE_LABELS,
    SegmentStats,
    feature_impacts,
    retention_actions,
    risk_level,
    value_label,
)
from churn.features import FEATURES, GENDERS, GEOGRAPHIES, TARGET, load_dataset
from churn.train import METRICS_PATH, MODEL_PATH, train

from .schemas import Customer, Prediction

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_BATCH_ROWS = 50_000
state: dict = {}


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not MODEL_PATH.exists() or not METRICS_PATH.exists():
        print("No trained model found, training now...")
        train()
    bundle = joblib.load(MODEL_PATH)
    df = load_dataset()
    state.update(
        bundle=bundle,
        metrics=json.loads(METRICS_PATH.read_text()),
        df=df,
        stats=SegmentStats(df),
    )
    yield
    state.clear()


app = FastAPI(title="ChurnLens API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    bundle = state["bundle"]
    return {
        "status": "ok",
        "model": "Gradient Boosting",
        "version": bundle["version"],
        "trained_at": bundle["trained_at"],
        "n_train": bundle["n_train"],
        "n_customers": int(len(state["df"])),
    }


@app.get("/api/metrics")
def metrics():
    return state["metrics"]


@app.post("/api/predict", response_model=Prediction)
def predict(customer: Customer):
    started = time.perf_counter()
    bundle, stats = state["bundle"], state["stats"]
    row = customer.model_dump()
    frame = pd.DataFrame([row])[FEATURES]

    probability, base_value, impacts = feature_impacts(bundle["pipeline"], bundle["background"], frame)
    risk = risk_level(probability)
    top = sorted(impacts.items(), key=lambda kv: abs(kv[1]), reverse=True)[:5]
    factors = [
        {
            "feature": feature,
            "label": value_label(feature, row[feature]),
            "note": stats.note(feature, row[feature]),
            "impact": impact,
        }
        for feature, impact in top
    ]
    threshold = state["metrics"]["threshold"]
    return {
        "probability": probability,
        "risk": risk,
        "will_churn": probability >= threshold,
        "threshold": threshold,
        "baseline_rate": stats.overall,
        "relative_risk": probability / stats.overall,
        "base_value": base_value,
        "total_impact": sum(impacts.values()),
        "factors": factors,
        "actions": retention_actions(row, impacts, risk, stats),
        "latency_ms": (time.perf_counter() - started) * 1000,
    }


def _read_batch(raw: bytes) -> pd.DataFrame:
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:  # noqa: BLE001 - surface parser errors to the user
        raise HTTPException(400, f"Could not read CSV: {exc}") from exc
    missing = [c for c in FEATURES if c not in df.columns]
    if missing:
        raise HTTPException(400, f"Missing column{'s' if len(missing) > 1 else ''}: {', '.join(missing)}")
    if df.empty:
        raise HTTPException(400, "The CSV has no rows.")
    if len(df) > MAX_BATCH_ROWS:
        raise HTTPException(400, f"Too many rows ({len(df):,}). The limit is {MAX_BATCH_ROWS:,}.")

    df["Geography"] = df["Geography"].astype(str).str.strip().str.title()
    df["Gender"] = df["Gender"].astype(str).str.strip().str.title()
    for column, allowed in (("Geography", GEOGRAPHIES), ("Gender", GENDERS)):
        bad = ~df[column].isin(allowed)
        if bad.any():
            row = int(bad.idxmax()) + 2  # +1 header, +1 one-based
            raise HTTPException(
                400,
                f"Row {row}: {column} must be one of {', '.join(allowed)} "
                f"(got '{df.loc[bad.idxmax(), column]}').",
            )
    numeric = [c for c in FEATURES if c not in ("Geography", "Gender")]
    for column in numeric:
        df[column] = pd.to_numeric(df[column], errors="coerce")
        if df[column].isna().any():
            row = int(df[column].isna().idxmax()) + 2
            raise HTTPException(400, f"Row {row}: {column} must be a number.")
    return df


@app.post("/api/predict/batch")
async def predict_batch(file: UploadFile = File(...)):
    started = time.perf_counter()
    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(400, "File is larger than 10 MB.")
    df = _read_batch(raw)

    probabilities = state["bundle"]["pipeline"].predict_proba(df[FEATURES])[:, 1]
    df["ChurnProbability"] = probabilities.round(4)
    df["RiskLevel"] = [risk_level(p) for p in probabilities]
    if "CustomerId" not in df.columns:
        df["CustomerId"] = range(1, len(df) + 1)
    if "Surname" not in df.columns:
        df["Surname"] = ""
    df = df.sort_values("ChurnProbability", ascending=False)

    counts = df["RiskLevel"].value_counts()
    columns = ["CustomerId", "Surname", *FEATURES, "ChurnProbability", "RiskLevel"]
    out = df[columns].astype({"CustomerId": str, "Surname": str})
    return {
        "filename": file.filename,
        "size_bytes": len(raw),
        "rows": out.to_dict(orient="records"),
        "summary": {
            "total": int(len(df)),
            "high": int(counts.get("high", 0)),
            "medium": int(counts.get("medium", 0)),
            "low": int(counts.get("low", 0)),
            "mean_probability": float(probabilities.mean()),
            "median_probability": float(pd.Series(probabilities).median()),
        },
        "baseline_rate": state["stats"].overall,
        "processing_ms": (time.perf_counter() - started) * 1000,
    }


@app.get("/api/sample-csv")
def sample_csv(rows: int = Query(250, ge=10, le=2000)):
    sample = state["df"].sample(rows, random_state=7)[["CustomerId", "Surname", *FEATURES]]
    buffer = io.StringIO()
    sample.to_csv(buffer, index=False)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=churnlens_sample_customers.csv"},
    )


def _rate_table(df: pd.DataFrame, key, labels=None) -> list[dict]:
    grouped = df.groupby(key, observed=True)[TARGET].agg(["mean", "sum", "count"])
    if labels is not None:
        grouped = grouped.reindex(labels)
    return [
        {
            "label": str(label),
            "rate": float(row["mean"]) if row["count"] else 0.0,
            "churned": int(row["sum"]) if row["count"] else 0,
            "count": int(row["count"]) if row["count"] else 0,
        }
        for label, row in grouped.fillna(0).iterrows()
    ]


@app.get("/api/insights")
def insights(
    geography: str = Query("All", pattern="^(All|France|Germany|Spain)$"),
    gender: str = Query("All", pattern="^(All|Female|Male)$"),
):
    df = state["df"]
    if geography != "All":
        df = df[df.Geography == geography]
    if gender != "All":
        df = df[df.Gender == gender]

    age_group = pd.cut(df.Age, AGE_BINS, labels=AGE_LABELS)
    activity = df.IsActiveMember.map({0: "Inactive", 1: "Active"})
    numeric = ["Age", "Balance", "IsActiveMember", "NumOfProducts", "CreditScore", "Tenure", "EstimatedSalary", "HasCrCard"]
    correlations = df[numeric + [TARGET]].corr()[TARGET].drop(TARGET)

    return {
        "filters": {"geography": geography, "gender": gender},
        "total": int(len(df)),
        "churned": int(df[TARGET].sum()),
        "retained": int((df[TARGET] == 0).sum()),
        "churn_rate": float(df[TARGET].mean()) if len(df) else 0.0,
        "by_country": _rate_table(df, "Geography", list(GEOGRAPHIES)),
        "by_gender": _rate_table(df, "Gender", list(GENDERS)),
        "by_age": _rate_table(df, age_group, AGE_LABELS),
        "by_products": _rate_table(df, "NumOfProducts", [1, 2, 3, 4]),
        "by_activity": _rate_table(df, activity, ["Inactive", "Active"]),
        "correlations": [
            {"feature": f, "value": float(v) if pd.notna(v) else 0.0}
            for f, v in correlations.reindex(correlations.abs().sort_values(ascending=False).index).items()
        ],
    }
