from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
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

CURRENT_SCHEMA_VERSION = "1.0"
SUPPORTED_SCHEMA_VERSIONS = {"1.0"}


class Athlete(BaseModel):
    schema_version: str = CURRENT_SCHEMA_VERSION
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


@app.get("/schema/version")
def get_schema_version():
    return {
        "current": CURRENT_SCHEMA_VERSION,
        "supported": sorted(SUPPORTED_SCHEMA_VERSIONS),
    }


@app.post("/rank")
def rank_athlete(athlete: Athlete):
    if athlete.schema_version not in SUPPORTED_SCHEMA_VERSIONS:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported schema version '{athlete.schema_version}'. "
                   f"Supported: {', '.join(sorted(SUPPORTED_SCHEMA_VERSIONS))}",
        )

    data = athlete.dict()
    data.pop("schema_version", None)
    df = pd.DataFrame([data])

   
    for col, le in label_encoders.items():
        if col in df:
            df[col] = le.transform(df[col])


    df_scaled = scaler.transform(df)

   
    score = model.predict(df_scaled)[0]
    return {"predicted_potential_score": float(score)}
