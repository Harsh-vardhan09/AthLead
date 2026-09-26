"""
Integration tests for the AthLead ML service API.

Run with:
  pip install pytest httpx fastapi
  pytest ML/tests/test_api.py -v

The tests use FastAPI's TestClient, so no running server is needed.
They do NOT depend on the Node.js backend or the frontend.
"""

import unittest
from unittest.mock import MagicMock, patch
import numpy as np
import sys
import os

# Stub heavy deps so tests import cleanly without pre-trained models on disk
sys.modules.setdefault("joblib", MagicMock())
sys.modules.setdefault("sklearn", MagicMock())

# Patch model loading to return mock objects before importing api
_mock_model = MagicMock()
_mock_model.predict.return_value = np.array([7.5])
_mock_model.estimators_ = [MagicMock(predict=lambda x: [7.5])] * 5
_mock_model.__class__.__name__ = "MockForest"

_mock_scaler = MagicMock()
_mock_scaler.transform.return_value = np.zeros((1, 12))
_mock_scaler.n_features_in_ = 12

_sport_le = MagicMock()
_sport_le.classes_ = np.array(["athletics", "basketball", "swimming"])
_sport_le.transform.return_value = np.array([0])

_gender_le = MagicMock()
_gender_le.classes_ = np.array(["F", "M"])
_gender_le.transform.return_value = np.array([0])

_mock_le = {"sport": _sport_le, "gender": _gender_le}

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

with patch("joblib.load", side_effect=[_mock_model, _mock_scaler, _mock_le]):
    from api import app

from fastapi.testclient import TestClient

client = TestClient(app)

VALID_PAYLOAD = {
    "sport": "athletics",
    "age": 22.0,
    "gender": "M",
    "training_years": 4.0,
    "vo2_max": 55.0,
    "hrv": 70.0,
    "lactate_threshold": 4.0,
    "stride_length": 1.8,
    "cadence": 180.0,
    "force_application": 1200.0,
    "performance_score": 75.0,
    "adaptability_score": 80.0,
}


class TestHealthEndpoint(unittest.TestCase):
    def test_health_returns_200(self):
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)

    def test_health_returns_model_loaded(self):
        body = response = client.get("/health").json()
        self.assertIn("status", body)
        self.assertIn("model_loaded", body)


class TestRankEndpoint(unittest.TestCase):
    def test_valid_payload_returns_200(self):
        response = client.post("/rank", json=VALID_PAYLOAD)
        self.assertEqual(response.status_code, 200)

    def test_valid_payload_returns_score(self):
        response = client.post("/rank", json=VALID_PAYLOAD)
        body = response.json()
        self.assertIn("predicted_potential_score", body)
        self.assertIsInstance(body["predicted_potential_score"], float)

    def test_missing_required_field_returns_422(self):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "sport"}
        response = client.post("/rank", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_negative_age_returns_422(self):
        payload = {**VALID_PAYLOAD, "age": -5.0}
        response = client.post("/rank", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_age_above_max_returns_422(self):
        payload = {**VALID_PAYLOAD, "age": 999.0}
        response = client.post("/rank", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_unknown_sport_returns_422(self):
        payload = {**VALID_PAYLOAD, "sport": "chess"}
        response = client.post("/rank", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_invalid_gender_returns_422(self):
        payload = {**VALID_PAYLOAD, "gender": "X"}
        response = client.post("/rank", json=payload)
        self.assertEqual(response.status_code, 422)


class TestSchemaVersionEndpoint(unittest.TestCase):
    def test_schema_version_returns_200(self):
        response = client.get("/schema/version")
        self.assertEqual(response.status_code, 200)

    def test_schema_version_structure(self):
        body = client.get("/schema/version").json()
        self.assertIn("current", body)
        self.assertIn("supported", body)
        self.assertIsInstance(body["supported"], list)


class TestModelInfoEndpoint(unittest.TestCase):
    def test_model_info_returns_200(self):
        response = client.get("/model/info")
        self.assertEqual(response.status_code, 200)

    def test_model_info_structure(self):
        body = client.get("/model/info").json()
        self.assertIn("model_version", body)
        self.assertIn("model_loaded", body)
        self.assertIn("feature_count", body)


if __name__ == "__main__":
    unittest.main()
