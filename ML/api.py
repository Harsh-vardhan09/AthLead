import hashlib
import logging
import math
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, field_validator
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor


logger = logging.getLogger(__name__)

SUPPORTED_SCHEMA_VERSIONS = {1}
CURRENT_SCHEMA_VERSION = 1
ARTIFACT_PATHS = (
    Path("models/athlete_rank_model.pkl"),
    Path("models/scaler.pkl"),
    Path("models/label_encoders.pkl"),
)


def fingerprint_artifacts(paths):
    """Identify the exact model, scaler, and encoders used for a prediction."""
    digest = hashlib.sha256()
    try:
        for path in paths:
            path = Path(path)
            digest.update(path.name.encode("utf-8"))
            digest.update(b"\0")
            with path.open("rb") as artifact:
                for chunk in iter(lambda: artifact.read(1024 * 1024), b""):
                    digest.update(chunk)
    except OSError:
        return None
    return f"sha256:{digest.hexdigest()}"

def load_inference_artifacts(paths):
    """Use a version only when artifacts stayed unchanged throughout loading."""
    version_before = fingerprint_artifacts(paths)
    loaded = [joblib.load(str(path)) for path in paths]
    version_after = fingerprint_artifacts(paths)
    version = version_before if version_before == version_after else None
    return *loaded, version


try:
    model, scaler, label_encoders, MODEL_VERSION = load_inference_artifacts(ARTIFACT_PATHS)
except Exception:
    logger.exception("ML model artifacts could not be loaded")
    model = scaler = label_encoders = None
    MODEL_VERSION = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Athlete(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)

    schema_version: int = Field(
        default=CURRENT_SCHEMA_VERSION,
        description="ML request schema version (default: 1)",
    )
    sport: str
    age: float = Field(ge=0)
    gender: str
    training_years: float = Field(ge=0)
    vo2_max: float = Field(ge=0)
    hrv: float = Field(ge=0)
    lactate_threshold: float = Field(ge=0)
    stride_length: float = Field(ge=0)
    cadence: float = Field(ge=0)
    force_application: float = Field(ge=0)
    performance_score: float = Field(ge=0)
    adaptability_score: float = Field(ge=0)

    @field_validator("schema_version")
    @classmethod
    def validate_schema_version(cls, v: int) -> int:
        if v not in SUPPORTED_SCHEMA_VERSIONS:
            supported = ", ".join(str(ver) for ver in sorted(SUPPORTED_SCHEMA_VERSIONS))
            raise ValueError(f"Unsupported schema version: {v}. Supported versions: [{supported}]")
        return v


@app.get("/health")
def health_check():
    """Verify ML service health and artifact readiness."""
    is_model_loaded = (
        model is not None and scaler is not None and label_encoders is not None
    )
    return {
        "status": "ok" if is_model_loaded else "degraded",
        "model_loaded": is_model_loaded,
    }


@app.get("/model/info")
def model_info():
    """Describe the loaded inference artifacts without exposing their contents."""
    if model is None or scaler is None or label_encoders is None:
        return {
            "model_loaded": False,
            "model_version": None,
            "model_type": None,
            "supported_sports": [],
            "feature_count": None,
        }

    sport_encoder = label_encoders.get("sport")
    sports = getattr(sport_encoder, "classes_", ())
    feature_count = getattr(model, "n_features_in_", None)
    if feature_count is None:
        feature_count = getattr(scaler, "n_features_in_", None)

    return {
        "model_loaded": True,
        "model_version": MODEL_VERSION,
        "model_type": type(model).__name__,
        "supported_sports": [str(sport) for sport in sports],
        "feature_count": int(feature_count) if feature_count is not None else None,
    }



@app.get("/health")
def health_check():
    model_loaded = (
        model is not None and scaler is not None and label_encoders is not None
    )
    status = "ok" if model_loaded else "error"
    return {
        "status": status,
        "model_loaded": model_loaded,
    }


@app.post("/rank")
def rank_athlete(athlete: Athlete):
    """Predict athlete potential score from biometric and performance metrics."""
    if model is None or scaler is None or label_encoders is None:
        raise HTTPException(status_code=503, detail="ML model unavailable")

    try:
        features = athlete.model_dump(exclude={"schema_version"})
        df = pd.DataFrame([features])
        for col, encoder in label_encoders.items():
            if col in df:
                if df[col].iloc[0] not in encoder.classes_:
                    raise HTTPException(status_code=422, detail=f"Unknown {col}")
                df[col] = encoder.transform(df[col])
    except HTTPException:
        raise
    except Exception:
        logger.exception("ML inference failed")
        raise HTTPException(status_code=500, detail="Prediction failed") from None

    try:
        scaled_features = scaler.transform(df)
        score = float(model.predict(scaled_features)[0])
        if not math.isfinite(score):
            raise ValueError("Model returned a non-finite score")
        response = {"predicted_potential_score": score, "model_version": MODEL_VERSION}

        # Tree disagreement is model-derived, but it is not a calibrated probability.
        trees = getattr(model, "estimators_", None)
        if (
            isinstance(model, RandomForestRegressor)
            and trees is not None
            and len(trees) > 1
        ):
            try:
                tree_scores = [float(tree.predict(scaled_features)[0]) for tree in trees]
                if all(math.isfinite(value) for value in tree_scores):
                    spread = float(np.std(tree_scores))
                    if math.isfinite(spread):
                        response["prediction_std"] = spread
                        response["confidence_note"] = (
                            "Standard deviation of individual tree predictions in score units; "
                            "lower means more agreement, not a calibrated confidence "
                            "probability or error bound."
                        )
            except Exception:
                logger.warning("Prediction spread unavailable", exc_info=True)

        return response
    except Exception:
        logger.exception("ML inference failed")
        raise HTTPException(status_code=500, detail="Prediction failed") from None
