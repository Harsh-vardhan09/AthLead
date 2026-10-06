from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api import app
import api as api_module

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "model_loaded" in data
    assert isinstance(data["model_loaded"], bool)
    assert data["status"] in ["ok", "error"]


def test_health_check_returns_ok_when_loaded():
    api_module.model = object()
    api_module.scaler = object()
    api_module.label_encoders = {}

    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True


def test_health_check_returns_error_when_unloaded():
    api_module.model = None
    api_module.scaler = None
    api_module.label_encoders = None

    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "error"
    assert data["model_loaded"] is False
