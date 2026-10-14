import importlib
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.testclient import TestClient
from sklearn.ensemble import RandomForestRegressor


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
        model if model is not None else Model(),
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
    def test_valid_prediction_returns_score_and_model_version(self):
        api = load_api()
        with patch.object(api, "MODEL_VERSION", "sha256:test-artifacts"):
            with TestClient(api.app) as client:
                response = client.post("/rank", json=VALID_ATHLETE)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"predicted_potential_score": 73.5, "model_version": "sha256:test-artifacts"},
        )

    def test_ensemble_reports_tree_disagreement_without_claiming_probability(self):
        ensemble = RandomForestRegressor(n_estimators=5, random_state=42)
        ensemble.fit([[value] * 12 for value in range(8)], [value * 10 for value in range(8)])
        with TestClient(load_api(artifacts(ensemble)).app) as client:
            response = client.post("/rank", json=VALID_ATHLETE)

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()["prediction_std"], 0)
        self.assertIn("not a calibrated", response.json()["confidence_note"])

    def test_invalid_or_missing_tree_predictions_omit_uncertainty(self):
        for tree_scores in ([], [70], [70, float("nan")]):
            with self.subTest(tree_scores=tree_scores):
                ensemble = RandomForestRegressor()
                ensemble.predict = Model(score=72).predict
                ensemble.estimators_ = [Model(score=value) for value in tree_scores]
                with TestClient(load_api(artifacts(ensemble)).app) as client:
                    response = client.post("/rank", json=VALID_ATHLETE)

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["predicted_potential_score"], 72)
                self.assertNotIn("prediction_std", response.json())
                self.assertNotIn("confidence_note", response.json())

    def test_other_model_with_estimators_does_not_claim_forest_uncertainty(self):
        model = Model(score=72)
        model.estimators_ = [Model(score=70), Model(score=74)]
        with TestClient(load_api(artifacts(model)).app) as client:
            response = client.post("/rank", json=VALID_ATHLETE)

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("prediction_std", response.json())

    def test_model_version_identifies_the_full_inference_artifact_set(self):
        api = load_api()
        with tempfile.TemporaryDirectory() as temp_dir:
            paths = [Path(temp_dir) / name for name in ("model.pkl", "scaler.pkl", "encoders.pkl")]
            for path, content in zip(paths, (b"model", b"scaler", b"encoders")):
                path.write_bytes(content)
            first_version = api.fingerprint_artifacts(paths)
            self.assertEqual(first_version, api.fingerprint_artifacts(paths))
            self.assertTrue(first_version.startswith("sha256:"))

            paths[1].write_bytes(b"new scaler")
            self.assertNotEqual(first_version, api.fingerprint_artifacts(paths))

    def test_model_version_is_unknown_if_an_artifact_changes_while_loading(self):
        api = load_api()
        with tempfile.TemporaryDirectory() as temp_dir:
            paths = [Path(temp_dir) / name for name in ("model.pkl", "scaler.pkl", "encoders.pkl")]
            for path, content in zip(paths, (b"model", b"scaler", b"encoders")):
                path.write_bytes(content)

            with patch("joblib.load", side_effect=lambda path: path):
                _, _, _, stable_version = api.load_inference_artifacts(paths)
            self.assertEqual(stable_version, api.fingerprint_artifacts(paths))

            def load_and_replace(path):
                if path == str(paths[0]):
                    paths[1].write_bytes(b"replacement scaler")
                return path

            with patch("joblib.load", side_effect=load_and_replace):
                _, _, _, version = api.load_inference_artifacts(paths)
            self.assertIsNone(version)

    def test_missing_field_returns_structured_client_error(self):
        with TestClient(load_api().app) as client:
            response = client.post(
                "/rank",
                json={key: value for key, value in VALID_ATHLETE.items() if key != "age"},
            )
        self.assertEqual(response.status_code, 422)
        self.assertIn("detail", response.json())

    def test_malformed_json_returns_client_error(self):
        with TestClient(load_api().app) as client:
            response = client.post(
                "/rank", content='{"sport":', headers={"content-type": "application/json"}
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
        self.assertEqual(response.json(), {"predicted_potential_score": 73.5, "model_version": None})

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

    def test_health_endpoint_healthy_when_model_loaded(self):
        """Verify GET /health returns status ok and model_loaded true when artifacts are loaded."""
        with TestClient(load_api().app) as client:
            response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "model_loaded": True})

    def test_health_endpoint_degraded_when_artifacts_missing(self):
        """Verify GET /health returns status degraded and model_loaded false when artifacts fail to load."""
        with self.assertLogs("api", level="ERROR"), TestClient(
            load_api(FileNotFoundError("private model path")).app
        ) as client:
            response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "degraded", "model_loaded": False})


class ModelInfoApiTests(unittest.TestCase):
    def test_reports_metadata_from_loaded_artifacts(self):
        model = Model()
        model.n_features_in_ = 12
        loaded_artifacts = [
            model,
            Scaler(),
            {"sport": Encoder(["running", "swimming"]), "gender": Encoder(["F"])},
        ]
        api = load_api(loaded_artifacts)
        with patch.object(api, "MODEL_VERSION", "sha256:test-artifacts"):
            with TestClient(api.app) as client:
                response = client.get("/model/info")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "model_loaded": True,
                "model_version": "sha256:test-artifacts",
                "model_type": "Model",
                "supported_sports": ["running", "swimming"],
                "feature_count": 12,
            },
        )
        self.assertNotIn("models/", response.text)

    def test_reports_unknown_metadata_without_guessing(self):
        with TestClient(load_api().app) as client:
            response = client.get("/model/info")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["model_version"], None)
        self.assertEqual(response.json()["feature_count"], None)
        self.assertNotIn("training_date", response.json())

    def test_missing_artifacts_do_not_expose_private_paths(self):
        with self.assertLogs("api", level="ERROR"), TestClient(
            load_api(FileNotFoundError("private model path")).app
        ) as client:
            response = client.get("/model/info")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "model_loaded": False,
                "model_version": None,
                "model_type": None,
                "supported_sports": [],
                "feature_count": None,
            },
        )
        self.assertNotIn("private model path", response.text)


if __name__ == "__main__":
    unittest.main()
