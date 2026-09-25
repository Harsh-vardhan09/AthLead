from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import joblib
import math
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

EXPECTED_FEATURES = [
    "sport", "age", "gender", "training_years", "vo2_max", "hrv",
    "lactate_threshold", "stride_length", "cadence", "force_application",
    "performance_score", "adaptability_score",
]

NUMERIC_RANGES = {
    "age": (10, 80),
    "training_years": (0, 40),
    "vo2_max": (10.0, 100.0),
    "hrv": (0.0, 200.0),
    "lactate_threshold": (0.0, 30.0),
    "stride_length": (0.0, 5.0),
    "cadence": (0.0, 300.0),
    "force_application": (0.0, 5000.0),
    "performance_score": (0.0, 100.0),
    "adaptability_score": (0.0, 100.0),
}

VALID_GENDERS = {"M", "F"}


def validate_features(data: dict) -> None:
    errors = []

    missing = [f for f in EXPECTED_FEATURES if f not in data]
    if missing:
        errors.append(f"Missing required features: {', '.join(missing)}")

    for field, (lo, hi) in NUMERIC_RANGES.items():
        val = data.get(field)
        if val is None:
            continue
        if not isinstance(val, (int, float)) or not math.isfinite(val):
            errors.append(f"'{field}' must be a finite number")
        elif not (lo <= val <= hi):
            errors.append(f"'{field}' value {val} is outside expected range [{lo}, {hi}]")

    gender = str(data.get("gender", "")).strip().upper()
    if gender and gender not in VALID_GENDERS:
        errors.append(f"'gender' must be one of {sorted(VALID_GENDERS)}, got '{gender}'")

    if label_encoders and "sport" in label_encoders:
        sport = str(data.get("sport", "")).strip()
        accepted = set(label_encoders["sport"].classes_)
        if sport and sport not in accepted:
            errors.append(f"Unknown sport '{sport}'. Accepted: {', '.join(sorted(accepted))}")

    if errors:
        raise HTTPException(status_code=422, detail={"validation_errors": errors})


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

    @field_validator("age", "training_years", "vo2_max", "hrv", "lactate_threshold",
                     "stride_length", "cadence", "force_application",
                     "performance_score", "adaptability_score")
    @classmethod
    def must_be_finite(cls, v, info):
        if not math.isfinite(v):
            raise ValueError(f"{info.field_name} must be a finite number")
        return v


@app.post("/rank")
def rank_athlete(athlete: Athlete):
    data = athlete.dict()

    validate_features(data)

    df = pd.DataFrame([data])

    for col, le in label_encoders.items():
        if col in df:
            unknown = set(df[col]) - set(le.classes_)
            if unknown:
                raise HTTPException(
                    status_code=422,
                    detail=f"Unknown {col} value(s): {', '.join(sorted(str(v) for v in unknown))}"
                )
            df[col] = le.transform(df[col])

    df_scaled = scaler.transform(df)
    score = model.predict(df_scaled)[0]
    return {"predicted_potential_score": float(score)}
