from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")

    assert response.json()['status'] == "healthy"
    assert response.status_code == 200

def test_predict():

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
