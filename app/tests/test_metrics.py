def test_metrics_endpoint(client):
    response = client.get("/metrics")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/plain; charset=utf-8"
    # Optionally check for some metric names
    assert "# HELP" in response.text
