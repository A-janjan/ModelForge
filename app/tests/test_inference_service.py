from unittest.mock import Mock

from app.services.inference_service import InferenceService

# Constants to represent a model row from the repository.
# The service uses row[2] as version and row[5] as weight.
MODEL_ROW = ("id", "name", "1.0.0", "extra", "extra", 1.0)


def test_single_active_model_returns_prediction_with_version(mocker):
    # Arrange: mock repository to return one active model as a tuple
    mock_repository: Mock = mocker.Mock()
    mock_repository.get_active_models.return_value = [MODEL_ROW]

    # Mock router's select_model method (the actual method used by the service)
    mock_router: Mock = mocker.Mock()
    mock_router.select_model.return_value = "1.0.0"

    # Mock model service to return a prediction
    mock_model_service: Mock = mocker.Mock()
    mock_model_service.predict.return_value = "..."

    inference_service = InferenceService(
        model_repository=mock_repository,
        router=mock_router,
        model_service=mock_model_service,
    )

    # Act
    features = [1.0, 2.0, 3.0]
    result = inference_service.predict(features)

    # Assert
    expected = {
        "prediction": "...",
        "model_version": "1.0.0",
    }
    assert result == expected


def test_router_is_called_exactly_once(mocker):
    # Arrange: mock repository to return one active model as a tuple
    mock_repository: Mock = mocker.Mock()
    mock_repository.get_active_models.return_value = [MODEL_ROW]

    # Mock router's select_model method
    mock_router: Mock = mocker.Mock()
    mock_router.select_model.return_value = "1.0.0"

    # Mock model service to return a prediction
    mock_model_service: Mock = mocker.Mock()
    mock_model_service.predict.return_value = "..."

    inference_service = InferenceService(
        model_repository=mock_repository,
        router=mock_router,
        model_service=mock_model_service,
    )

    # Act
    features = [1.0, 2.0, 3.0]
    inference_service.predict(features)

    # Assert
    mock_router.select_model.assert_called_once()
