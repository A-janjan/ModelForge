import pytest  # pyright: ignore[reportMissingImports]
from fastapi.testclient import TestClient  # pyright: ignore[reportMissingImports]

from app.main import app


@pytest.fixture
def client():
    """Return a test client instance."""
    return TestClient(app)


@pytest.fixture
def default_payload():
    """Default payload for model creation."""
    return {
        "name": "test-model",
        "version": "1.0.0",
        "artifact_path": "models/test_model.pkl",
        "status": "active",
        "traffic_weight": 10,
    }


def delete_model(client, model_id):
    """Delete a model by ID and assert success."""
    response = client.delete(f"/admin/models/{model_id}")
    assert response.status_code in (200, 204), f"Failed to delete model {model_id}"


def test_create_model(client, default_payload):
    """
    POST /admin/models

    expect 200 or 201

    verify:
        model exists afterwards
    """
    model_id = None
    try:
        response = client.post("/admin/models", json=default_payload)
        assert response.status_code in (200, 201)

        model_data = response.json()["model"]
        model_id = model_data[0]
        assert model_id is not None

        get_response = client.get(f"/admin/models/{model_id}")
        assert get_response.status_code == 200
        retrieved = get_response.json()
        assert retrieved["id"] == model_id
        assert retrieved["name"] == default_payload["name"]
        assert retrieved["version"] == default_payload["version"]
        assert retrieved["artifact_path"] == default_payload["artifact_path"]
        assert retrieved["status"] == default_payload["status"]
        assert retrieved["traffic_weight"] == default_payload["traffic_weight"]
    finally:
        if model_id is not None:
            delete_model(client, model_id)


def test_update_traffic_weight(client, default_payload):
    """
    create model

    change weight to 50

    fetch model

    verify weight=50
    """
    model_id = None
    try:
        # Create model
        response = client.post("/admin/models", json=default_payload)
        assert response.status_code in (200, 201)
        model_data = response.json()["model"]
        model_id = model_data[0]
        version = model_data[2]
        # Update traffic weight
        update_payload = {"traffic_weight": 50}
        update_response = client.put(
            f"/admin/models/{version}/weight", json=update_payload
        )
        assert update_response.status_code in (200, 201)

        # Verify weight changed
        get_response = client.get(f"/admin/models/version/{version}")
        assert get_response.status_code == 200
        retrieved = get_response.json()
        print("=" * 200)
        print(retrieved)
        assert retrieved["traffic_weight"] == 50
    finally:
        if model_id is not None:
            delete_model(client, model_id)


def test_update_status(client, default_payload):
    """
    create model

    set inactive

    verify status changed
    """
    model_id = None
    try:
        response = client.post("/admin/models", json=default_payload)
        assert response.status_code in (200, 201)
        model_data = response.json()["model"]
        model_id = model_data[0]

        update_payload = {"status": "inactive"}
        update_response = client.put(f"/admin/models/{model_id}", json=update_payload)
        assert update_response.status_code in (200, 201)

        get_response = client.get(f"/admin/models/{model_id}")
        assert get_response.status_code == 200
        retrieved = get_response.json()
        assert retrieved["status"] == "inactive"
    finally:
        if model_id is not None:
            delete_model(client, model_id)


def test_rollback_model(client, default_payload):
    """
    v1 active
    v2 active

    rollback v1

    verify:
        v1 active
        v2 inactive
    """
    v1_payload = {
        **default_payload,
        "version": "1.0.0",
    }
    v2_payload = {
        **default_payload,
        "version": "2.0.0",
    }

    v1_id = None
    v2_id = None

    try:
        # Create v1
        r1 = client.post("/admin/models", json=v1_payload)
        assert r1.status_code in (200, 201)
        v1_data = r1.json()["model"]
        v1_id = v1_data[0]

        # Create v2
        r2 = client.post("/admin/models", json=v2_payload)
        assert r2.status_code in (200, 201)
        v2_data = r2.json()["model"]
        v2_id = v2_data[0]

        # Rollback to v1 (using version string)
        rollback_response = client.put("/admin/models/1.0.0/rollback")
        assert rollback_response.status_code in (200, 201)

        # Get v1
        v1_get = client.get(f"/admin/models/{v1_id}")
        assert v1_get.status_code == 200
        assert v1_get.json()["status"] == "active"

        # Get v2
        v2_get = client.get(f"/admin/models/{v2_id}")
        assert v2_get.status_code == 200
        assert v2_get.json()["status"] == "inactive"

    finally:
        # Clean up in reverse creation order
        if v2_id is not None:
            delete_model(client, v2_id)
        if v1_id is not None:
            delete_model(client, v1_id)
