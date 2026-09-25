import os
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger("ml-api")

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

model = None
scaler = None
label_encoders = None


def load_models():
    global model, scaler, label_encoders
    model_path = os.path.join(MODEL_DIR, "athlete_rank_model.pkl")
    scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")
    encoders_path = os.path.join(MODEL_DIR, "label_encoders.pkl")

    for path, name in [
        (model_path, "model"),
        (scaler_path, "scaler"),
        (encoders_path, "label_encoders"),
    ]:
        if not os.path.isfile(path):
            logger.error("Missing model file: %s", path)
            return

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    label_encoders = joblib.load(encoders_path)
    logger.info("All model artifacts loaded successfully")


load_models()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Athlete(BaseModel):
    sport: str
    age: float
    gender: str
    training_years: float
    vo2_max: float
    hrv: float
    lactate_threshold: float
    stride_length: float
    cadence: float
    force_application: float
    performance_score: float
    adaptability_score: float

    @field_validator("age", "training_years", "vo2_max", "hrv",
                     "lactate_threshold", "stride_length", "cadence",
                     "force_application", "performance_score",
                     "adaptability_score")
    @classmethod
    def must_be_non_negative(cls, v, info):
        if not np.isfinite(v) or v < 0:
            raise ValueError(f"{info.field_name} must be a finite non-negative number")
        return v


@app.post("/rank")
def rank_athlete(athlete: Athlete):
    if model is None or scaler is None or label_encoders is None:
        raise HTTPException(
            status_code=503,
            detail="ML models are not loaded. Check server logs.",
        )

    df = pd.DataFrame([athlete.model_dump()])

    for col, le in label_encoders.items():
        if col in df:
            unknown = set(df[col]) - set(le.classes_)
            if unknown:
                raise HTTPException(
                    status_code=422,
                    detail=f"Unknown {col} value(s): {', '.join(sorted(unknown))}. "
                           f"Accepted: {', '.join(sorted(le.classes_))}",
                )
            df[col] = le.transform(df[col])

    try:
        df_scaled = scaler.transform(df)
        score = model.predict(df_scaled)[0]
    except Exception as e:
        logger.exception("Model inference failed")
        raise HTTPException(
            status_code=500,
            detail="Model inference failed. Please try again later.",
        )

    return {"predicted_potential_score": float(score)}
