from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.middleware import api_key_auth


@pytest.fixture
def use_real_auth():
    """
    Remove the dependency override added by conftest.py, so that the
    real API key validation is executed.
    """
    app.dependency_overrides.clear()
    yield
    # (no cleanup needed – overrides will be cleared again by conftest
    # after the test, but we leave it for clarity)


@pytest.fixture
def client(use_real_auth):
    """
    Provide a TestClient with real authentication enabled.
    The use_real_auth fixture runs before this, ensuring no overrides.
    """
    return TestClient(app)


# Common payload for prediction requests
PAYLOAD = {
    "sepal_length": 1.0,
    "sepal_width": 2.0,
    "petal_length": 3.0,
    "petal_width": 4.0,
}


def test_missing_api_key(client):
    response = client.post(
        "/predict",
        json=PAYLOAD,
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing API Key"


def test_invalid_api_key(client):
    headers = {"X-API-Key": "wrong-key"}
    response = client.post(
        "/predict",
        json=PAYLOAD,
        headers=headers,
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid API Key"


def test_valid_api_key(client):
    """
    Correct key → 200 OK.
    Patch the middleware's VALID_API_KEY to a test key, and mock the
    prediction service to avoid database/model dependencies.
    """
    # Override the expected key *only* for this test (secure: no .env used)
    with patch.object(api_key_auth, "VALID_API_KEY", "test-key-123"):
        headers = {"X-API-Key": "test-key-123"}

        # Mock the prediction logic so the endpoint returns quickly
        with patch("app.api.prediction.inference_service.predict") as mock_predict:
            mock_predict.return_value = {
                "prediction": "mock_prediction",
                "model_version": "1.0.0",
            }
            response = client.post("/predict", json=PAYLOAD, headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "mock_prediction"
    assert data["model_version"] == "1.0.0"
