import os
import time

import pytest

from app.main import app
from app.repositories.model_repository import ModelRepository


@pytest.fixture(autouse=True)
def setup_and_teardown():
    """Create a test model in the database before each test, delete it after."""
    repo = ModelRepository()
    version = f"test_{int(time.time())}"
    artifact_path = "models/iris_model.pkl"  # assumes this exists

    # Skip test if the artifact is missing (prevents false failures)
    if not os.path.exists(artifact_path):
        pytest.skip(f"Artifact {artifact_path} not found; run training first.")

    # Insert model
    record = repo.create_model(
        name="iris",
        version=version,
        artifact_path=artifact_path,
        status="active",
        traffic_weight=100,
    )
    assert record is not None, "Failed to create test model"
    model_id = record[0]

    # Store version in fixture context for use in tests
    yield {"version": version, "model_id": model_id}

    # Clean up after test
    repo.delete_model(model_id)


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_predict(setup_and_teardown, client):
    # The fixture ensures an active model exists; we can optionally use its version.
    payload = {
        "sepal_length": 2.3,
        "sepal_width": 4.2,
        "petal_length": 8.2,
        "petal_width": 6.3,
    }

    response = client.post("/predict", json=payload)

    assert response.status_code == 200

    body = response.json()
    assert "prediction" in body
    assert "model_version" in body
    # Optionally verify the returned version matches the created one:
    # assert body["model_version"] == setup_and_teardown["version"]
