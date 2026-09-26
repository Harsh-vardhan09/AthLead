import os
import time
from collections import defaultdict
from threading import Lock

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd

# ---------------------------------------------------------------------------
# Simple in-memory sliding-window rate limiter
# Configure via env vars:
#   RATE_LIMIT_REQUESTS  — max requests per window (default 10)
#   RATE_LIMIT_WINDOW    — window size in seconds (default 60)
# ---------------------------------------------------------------------------
_RATE_LIMIT = int(os.environ.get("RATE_LIMIT_REQUESTS", "10"))
_RATE_WINDOW = int(os.environ.get("RATE_LIMIT_WINDOW", "60"))
_rate_store: dict[str, list[float]] = defaultdict(list)
_rate_lock = Lock()


def _check_rate_limit(client_ip: str) -> None:
    now = time.monotonic()
    window_start = now - _RATE_WINDOW
    with _rate_lock:
        timestamps = _rate_store[client_ip]
        # Remove timestamps outside the window
        _rate_store[client_ip] = [t for t in timestamps if t > window_start]
        if len(_rate_store[client_ip]) >= _RATE_LIMIT:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded: max {_RATE_LIMIT} requests per {_RATE_WINDOW}s",
                headers={"Retry-After": str(_RATE_WINDOW)},
            )
        _rate_store[client_ip].append(now)


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
def rank_athlete(athlete: Athlete, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    _check_rate_limit(client_ip)

    df = pd.DataFrame([athlete.dict()])

   
    for col, le in label_encoders.items():
        if col in df:
            df[col] = le.transform(df[col])


    df_scaled = scaler.transform(df)

   
    score = model.predict(df_scaled)[0]
    return {"predicted_potential_score": float(score)}
