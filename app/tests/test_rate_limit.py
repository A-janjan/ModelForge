import pytest
from unittest.mock import Mock, patch
from app.main import app
from app.middleware.rate_limit import RateLimiter, check_rate_limit
from fastapi import HTTPException, status

# Common payload for prediction requests
PAYLOAD = {
    "sepal_length": 1.0,
    "sepal_width": 2.0,
    "petal_length": 3.0,
    "petal_width": 4.0,
}


def test_rate_limiter_first_request():
    mock_redis = Mock()
    mock_redis.incr.return_value = 1
    limiter = RateLimiter(redis_client=mock_redis)
    assert limiter.check_rate_limit("key1", "/predict") is True
    mock_redis.incr.assert_called_once_with("rate_limit:key1:/predict")
    mock_redis.expire.assert_called_once_with("rate_limit:key1:/predict", 60)


def test_rate_limiter_under_limit():
    """Unit test: check_rate_limit returns True when counter <= limit."""
    mock_redis = Mock()
    mock_redis.incr.return_value = 3  # 3rd request, limit=5
    limiter = RateLimiter(redis_client=mock_redis)
    assert limiter.check_rate_limit("key1", "/predict") is True
    mock_redis.incr.assert_called_once_with("rate_limit:key1:/predict")
    mock_redis.expire.assert_not_called()


def test_rate_limiter_over_limit():
    """Unit test: check_rate_limit returns False when counter > limit."""
    mock_redis = Mock()
    mock_redis.incr.return_value = 6  # 6th request, limit=5
    limiter = RateLimiter(redis_client=mock_redis)
    assert limiter.check_rate_limit("key1", "/predict") is False


def test_under_limit_endpoint(client):
    """
    Integration test: simulate under limit by overriding the rate limiter
    to always allow the request, and mock the prediction to avoid DB calls.
    """

    # Override the check_rate_limit dependency to return the API key (no exception)
    async def mock_check_rate_limit():
        return "test-api-key"

    app.dependency_overrides[check_rate_limit] = mock_check_rate_limit

    with patch("app.api.prediction.inference_service.predict") as mock_predict:
        mock_predict.return_value = {"prediction": "setosa", "model_version": "v1"}
        response = client.post("/predict", json=PAYLOAD)

    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "setosa"
    assert data["model_version"] == "v1"
    app.dependency_overrides.clear()


def test_over_limit_endpoint(client):
    """
    Integration test: simulate over limit by raising HTTP 429.
    """

    async def mock_check_rate_limit():
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded"
        )

    app.dependency_overrides[check_rate_limit] = mock_check_rate_limit

    response = client.post("/predict", json=PAYLOAD)
    assert response.status_code == 429
    assert response.json()["detail"] == "Rate limit exceeded"

    app.dependency_overrides.clear()


def test_different_keys_independent():
    """
    Unit test: verify that two different API keys maintain separate counters.
    We simulate two calls with different keys and ensure redis.incr is called
    with the correct keys.
    """
    mock_redis = Mock()
    mock_redis.incr.side_effect = [1, 1]  # first call for each key returns 1
    limiter = RateLimiter(redis_client=mock_redis)

    # First key
    result1 = limiter.check_rate_limit("keyA", "/predict")
    assert result1 is True
    # Second key
    result2 = limiter.check_rate_limit("keyB", "/predict")
    assert result2 is True

    # Verify incr was called with different keys
    expected_calls = [
        (("rate_limit:keyA:/predict",), {}),
        (("rate_limit:keyB:/predict",), {}),
    ]
    assert mock_redis.incr.call_args_list == expected_calls
    # expire should be called for each key when incr returns 1
    assert mock_redis.expire.call_count == 2
