import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd

logger = logging.getLogger("ml-api")

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

model = None
scaler = None
label_encoders = None


def _load_models():
    global model, scaler, label_encoders
    paths = {
        "model": os.path.join(MODEL_DIR, "athlete_rank_model.pkl"),
        "scaler": os.path.join(MODEL_DIR, "scaler.pkl"),
        "label_encoders": os.path.join(MODEL_DIR, "label_encoders.pkl"),
    }
    for name, path in paths.items():
        if not os.path.isfile(path):
            logger.error("Missing model file: %s (%s)", name, path)
            return
    model = joblib.load(paths["model"])
    scaler = joblib.load(paths["scaler"])
    label_encoders = joblib.load(paths["label_encoders"])
    logger.info("All model artifacts loaded successfully")


_load_models()

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    models_loaded = all(x is not None for x in [model, scaler, label_encoders])
    status = "ok" if models_loaded else "degraded"
    return {"status": status, "model_loaded": models_loaded}


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

@app.post("/rank")
def rank_athlete(athlete: Athlete):
    df = pd.DataFrame([athlete.dict()])

   
    for col, le in label_encoders.items():
        if col in df:
            df[col] = le.transform(df[col])


    df_scaled = scaler.transform(df)

   
    score = model.predict(df_scaled)[0]
    return {"predicted_potential_score": float(score)}
