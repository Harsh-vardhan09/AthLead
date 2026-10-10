import importlib
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.testclient import TestClient


ML_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ML_DIR))

VALID_ATHLETE = {
    "sport": "running",
    "age": "22",
    "gender": "F",
    "training_years": 5,
    "vo2_max": 48,
    "hrv": 58,
    "lactate_threshold": 3,
    "stride_length": 1.4,
    "cadence": 170,
    "force_application": 75,
    "performance_score": 82,
    "adaptability_score": 76,
}


class Encoder:
    def __init__(self, classes):
        self.classes_ = classes

    def transform(self, values):
        return [self.classes_.index(value) for value in values]


class Scaler:
    def transform(self, frame):
        return frame.to_numpy()


class Model:
    def __init__(self, score=73.5, error=None):
        self.score = score
        self.error = error

    def predict(self, values):
        if self.error:
            raise self.error
        return [self.score]


def artifacts(model=None):
    return [
        model or Model(),
        Scaler(),
        {"sport": Encoder(["running"]), "gender": Encoder(["F"])},
    ]


def load_api(load_result=None):
    if load_result is None:
        load_result = artifacts()
    with patch("joblib.load", side_effect=load_result):
        if "api" in sys.modules:
            return importlib.reload(sys.modules["api"])
        return importlib.import_module("api")


class RankApiTests(unittest.TestCase):
    def test_valid_prediction_keeps_response_shape(self):
        with TestClient(load_api().app) as client:
            response = client.post("/rank", json=VALID_ATHLETE)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"predicted_potential_score": 73.5})

    def test_missing_field_returns_structured_client_error(self):
        with TestClient(load_api().app) as client:
            response = client.post(
                "/rank",
                json={key: value for key, value in VALID_ATHLETE.items() if key != "age"},
            )
        self.assertEqual(response.status_code, 422)
        self.assertIn("detail", response.json())

    def test_unknown_categories_return_client_errors(self):
        with TestClient(load_api().app) as client:
            for field in ("sport", "gender"):
                with self.subTest(field=field):
                    response = client.post("/rank", json={**VALID_ATHLETE, field: "unknown"})
                    self.assertEqual(response.status_code, 422)
                    self.assertIn("detail", response.json())

    def test_invalid_numbers_return_client_errors(self):
        with TestClient(load_api().app) as client:
            for field, value in (("age", -1), ("training_years", -1), ("vo2_max", "NaN")):
                with self.subTest(field=field):
                    response = client.post("/rank", json={**VALID_ATHLETE, field: value})
                    self.assertEqual(response.status_code, 422)
                    self.assertIn("detail", response.json())

    def test_missing_model_returns_controlled_server_error(self):
        with self.assertLogs("api", level="ERROR"), TestClient(
            load_api(FileNotFoundError("private model path")).app
        ) as client:
            response = client.post("/rank", json=VALID_ATHLETE)
        self.assertEqual(response.status_code, 503)
        self.assertIn("detail", response.json())
        self.assertNotIn("private model path", response.text)

    def test_partially_loaded_model_returns_controlled_server_error(self):
        with self.assertLogs("api", level="ERROR"), TestClient(
            load_api([Model(), FileNotFoundError("private scaler path")]).app
        ) as client:
            response = client.post("/rank", json=VALID_ATHLETE)
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("private scaler path", response.text)

    def test_inference_failure_returns_controlled_server_error(self):
        for error in (RuntimeError("private model detail"), HTTPException(418, "private model detail")):
            with self.subTest(error=type(error).__name__):
                broken_model = Model(error=error)
                with TestClient(load_api(artifacts(broken_model)).app) as client:
                    with self.assertLogs("api", level="ERROR"):
                        response = client.post("/rank", json=VALID_ATHLETE)
                self.assertEqual(response.status_code, 500)
                self.assertIn("detail", response.json())
                self.assertNotIn("private model detail", response.text)

    def test_non_finite_prediction_returns_controlled_server_error(self):
        with TestClient(load_api(artifacts(Model(score=float("nan")))).app) as client:
            with self.assertLogs("api", level="ERROR"):
                response = client.post("/rank", json=VALID_ATHLETE)
        self.assertEqual(response.status_code, 500)
        self.assertIn("detail", response.json())
        self.assertNotIn("NaN", response.text)

    def test_explicit_valid_schema_version_succeeds(self):
        with TestClient(load_api().app) as client:
            response = client.post("/rank", json={**VALID_ATHLETE, "schema_version": 1})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"predicted_potential_score": 73.5})

    def test_unsupported_schema_version_returns_client_error(self):
        with TestClient(load_api().app) as client:
            for invalid_version in (0, 2, -1, 99, "v1"):
                with self.subTest(version=invalid_version):
                    response = client.post(
                        "/rank", json={**VALID_ATHLETE, "schema_version": invalid_version}
                    )
                    self.assertEqual(response.status_code, 422)
                    self.assertIn("detail", response.json())

    def test_schema_version_excluded_from_model_features(self):
        captured_columns = []

        class SpyingScaler:
            def transform(self, frame):
                captured_columns.extend(frame.columns.tolist())
                return frame.to_numpy()

        spying_artifacts = [
            Model(),
            SpyingScaler(),
            {"sport": Encoder(["running"]), "gender": Encoder(["F"])},
        ]
        with TestClient(load_api(spying_artifacts).app) as client:
            response = client.post("/rank", json={**VALID_ATHLETE, "schema_version": 1})
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("schema_version", captured_columns)
        self.assertIn("sport", captured_columns)


if __name__ == "__main__":
    unittest.main()
