import logging
import math

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, field_validator
import joblib
import pandas as pd


logger = logging.getLogger(__name__)

SUPPORTED_SCHEMA_VERSIONS = {1}
CURRENT_SCHEMA_VERSION = 1

try:
    model = joblib.load("models/athlete_rank_model.pkl")
    scaler = joblib.load("models/scaler.pkl")
    label_encoders = joblib.load("models/label_encoders.pkl")
except Exception:
    logger.exception("ML model artifacts could not be loaded")
    model = scaler = label_encoders = None

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
        score = float(model.predict(scaler.transform(df))[0])
        if not math.isfinite(score):
            raise ValueError("Model returned a non-finite score")
        return {"predicted_potential_score": score}
    except Exception:
        logger.exception("ML inference failed")
        raise HTTPException(status_code=500, detail="Prediction failed") from None
