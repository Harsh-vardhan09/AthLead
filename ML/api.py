from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
scaler = None
label_encoders = None


def load_artifacts():
    global model, scaler, label_encoders
    try:
        if os.path.exists("models/athlete_rank_model.pkl"):
            model = joblib.load("models/athlete_rank_model.pkl")
        if os.path.exists("models/scaler.pkl"):
            scaler = joblib.load("models/scaler.pkl")
        if os.path.exists("models/label_encoders.pkl"):
            label_encoders = joblib.load("models/label_encoders.pkl")
    except Exception:
        model = None
        scaler = None
        label_encoders = None


load_artifacts()


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
    if not (model and scaler and label_encoders):
        raise HTTPException(
            status_code=503, detail="Model artifacts not available"
        )

    df = pd.DataFrame(
        [
            athlete.model_dump()
            if hasattr(athlete, "model_dump")
            else athlete.dict()
        ]
    )

    for col, le in label_encoders.items():
        if col in df:
            df[col] = le.transform(df[col])

    df_scaled = scaler.transform(df)

    score = model.predict(df_scaled)[0]
    return {"predicted_potential_score": float(score)}
