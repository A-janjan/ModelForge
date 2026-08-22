import pytest
from unittest.mock import Mock, patch
from app.services.cache_service import CacheService
from app.services.inference_service import InferenceService

MODEL_ROW = ("id", "name", "1.0.0", "extra", "extra", 1.0)


def test_generate_cache_key():
    """
    ensure same features produce same key, different versions produce different keys.
    """
    cache = CacheService(redis_client=Mock())
    key1 = cache.generate_cache_key("1.0.0", [1.0, 2.0, 3.0])
    key2 = cache.generate_cache_key("1.0.0", [1.0, 2.0, 3.0])
    key3 = cache.generate_cache_key("2.0.0", [1.0, 2.0, 3.0])
    assert key1 == key2
    assert key1 != key3
    # Also ensure different feature order yields same key (if using sorted JSON)
    key4 = cache.generate_cache_key("1.0.0", [3.0, 2.0, 1.0])
    # Since we sort keys, it should be same as key1?
    # Actually sorting the list before hashing would make it same,
    # but we hash the JSON string with sort_keys=True, so it will be sorted. So key1 == key4.
    assert key1 == key4


def test_cache_hit(mocker):
    """
    mock Redis to return a value; verify predict returns cached.
    """
    # Arrange: mock repo, router, model_service, and cache
    mock_repo = mocker.Mock()
    mock_repo.get_active_models.return_value = [MODEL_ROW]

    mock_router = mocker.Mock()
    mock_router.select_model.return_value = "1.0.0"

    mock_model_service = mocker.Mock()
    # Ensure model_service.predict is not called on cache hit
    mock_model_service.predict.side_effect = RuntimeError("Should not be called")

    mock_redis = mocker.Mock()
    mock_redis.get.return_value = "cached_result"

    cache_service = CacheService(redis_client=mock_redis)
    inference_service = InferenceService(
        model_repository=mock_repo,
        router=mock_router,
        model_service=mock_model_service,
        cache_service=cache_service,
    )

    features = [1.0, 2.0, 3.0, 4.0]

    result = inference_service.predict(features)
    assert result["prediction"] == "cached_result"
    assert result["model_version"] == "1.0.0"
    mock_model_service.predict.assert_not_called()
    mock_redis.get.assert_called_once()
    # Optionally verify the key used
    expected_key = cache_service.generate_cache_key("1.0.0", features)
    mock_redis.get.assert_called_with(expected_key)


def test_cache_miss(mocker):
    """
    mock Redis to return None; verify prediction is computed and stored.
    """
    mock_repo = mocker.Mock()
    mock_repo.get_active_models.return_value = [MODEL_ROW]

    mock_router = mocker.Mock()
    mock_router.select_model.return_value = "1.0.0"

    mock_model_service = mocker.Mock()
    mock_model_service.predict.return_value = "fresh_prediction"

    mock_redis = mocker.Mock()
    mock_redis.get.return_value = None

    cache_service = CacheService(redis_client=mock_redis)
    inference_service = InferenceService(
        model_repository=mock_repo,
        router=mock_router,
        model_service=mock_model_service,
        cache_service=cache_service,
    )

    features = [1.0, 2.0, 3.0, 4.0]

    # Act
    result = inference_service.predict(features)

    # Assert
    assert result["prediction"] == "fresh_prediction"
    assert result["model_version"] == "1.0.0"
    mock_model_service.predict.assert_called_once_with("1.0.0", features)
    expected_key = cache_service.generate_cache_key("1.0.0", features)
    mock_redis.set.assert_called_once_with(expected_key, "fresh_prediction", 3600)


def test_cache_store(mocker):
    """
    verify 'set' is called with correct key/value.
    This test is essentially a more detailed check of the cache miss path.
    """
    mock_repo = mocker.Mock()
    mock_repo.get_active_models.return_value = [MODEL_ROW]

    mock_router = mocker.Mock()
    mock_router.select_model.return_value = "1.0.0"

    mock_model_service = mocker.Mock()
    mock_model_service.predict.return_value = "stored_value"

    mock_redis = mocker.Mock()
    mock_redis.get.return_value = None

    cache_service = CacheService(redis_client=mock_redis)
    inference_service = InferenceService(
        model_repository=mock_repo,
        router=mock_router,
        model_service=mock_model_service,
        cache_service=cache_service,
    )

    features = [5.1, 3.5, 1.4, 0.2]

    # Act
    inference_service.predict(features)

    # Assert the exact set call
    expected_key = cache_service.generate_cache_key("1.0.0", features)
    mock_redis.set.assert_called_once_with(expected_key, "stored_value", 3600)


def test_cache_version_isolation(mocker):
    """
    verify that keys include version, so different versions don't collide.
    We test that predictions for two versions produce different cache keys
    and that cache retrieval respects the version.
    """
    # Create two model rows with different versions
    model_row_v1 = ("id1", "name", "1.0.0", "path", "active", 100)
    model_row_v2 = (
        "id2",
        "name",
        "2.0.0",
        "path",
        "active",
        0,
    )  # weight 0, but we'll control router

    mock_repo = mocker.Mock()
    # Return both active models so router can choose
    mock_repo.get_active_models.return_value = [model_row_v1, model_row_v2]

    mock_router = mocker.Mock()
    # We will simulate router picking v1 and then v2 in separate calls
    # We'll use side_effect to return different versions on each call
    mock_router.select_model.side_effect = ["1.0.0", "2.0.0"]

    mock_model_service = mocker.Mock()
    mock_model_service.predict.side_effect = ["pred_v1", "pred_v2"]

    mock_redis = mocker.Mock()
    # Simulate cache miss for both calls
    mock_redis.get.return_value = None

    cache_service = CacheService(redis_client=mock_redis)
    inference_service = InferenceService(
        model_repository=mock_repo,
        router=mock_router,
        model_service=mock_model_service,
        cache_service=cache_service,
    )

    features = [1.0, 2.0, 3.0, 4.0]

    # First call -> should miss, compute, and store for v1
    result1 = inference_service.predict(features)
    assert result1["model_version"] == "1.0.0"
    key_v1 = cache_service.generate_cache_key("1.0.0", features)
    mock_redis.set.assert_called_with(key_v1, "pred_v1", 3600)

    # Reset mock to capture second call
    mock_redis.reset_mock()
    # Second call -> router returns v2, miss again, compute and store v2
    result2 = inference_service.predict(features)
    assert result2["model_version"] == "2.0.0"
    key_v2 = cache_service.generate_cache_key("2.0.0", features)
    mock_redis.set.assert_called_with(key_v2, "pred_v2", 3600)

    # Verify that the keys are different
    assert key_v1 != key_v2
    # Ensure that the cache keys used in get/set are version-specific
    # (Already verified via generate_cache_key and the set calls)
