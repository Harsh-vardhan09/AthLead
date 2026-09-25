from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd


model = joblib.load("models/athlete_rank_model.pkl")
scaler = joblib.load("models/scaler.pkl")
label_encoders = joblib.load("models/label_encoders.pkl")

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

@app.post("/rank")
def rank_athlete(athlete: Athlete):
    df = pd.DataFrame([athlete.dict()])

   
    for col, le in label_encoders.items():
        if col in df:
            df[col] = le.transform(df[col])


    df_scaled = scaler.transform(df)

    score = model.predict(df_scaled)[0]

    response = {"predicted_potential_score": float(score)}

    if hasattr(model, "estimators_"):
        tree_predictions = np.array([
            tree.predict(df_scaled)[0] for tree in model.estimators_
        ])
        response["prediction_std"] = float(np.std(tree_predictions))
        response["confidence_note"] = (
            "prediction_std is the standard deviation across individual "
            "tree predictions — lower values indicate higher agreement"
        )

    return response
