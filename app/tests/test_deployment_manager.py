from unittest.mock import Mock

from app.services.deployment_manager import DeploymentManager


def test_deploy_model_active(mocker):
    mock_repo = Mock()
    mock_repo.create_model.return_value = (1, "model", "1.0.0", "/path", "active", 100)
    mock_model_service = Mock()
    dm = DeploymentManager(repository=mock_repo, model_service=mock_model_service)
    record = dm.deploy_model("model", "1.0.0", "/path", status="active")
    mock_repo.create_model.assert_called_once()
    mock_model_service.load_model.assert_called_once_with("1.0.0", "/path")
    assert record[0] == 1


def test_rollback(mocker):
    mock_repo = Mock()
    mock_repo.rollback_model.return_value = True
    mock_repo.get_model_by_version.return_value = (
        2,
        "model",
        "1.0.0",
        "/path",
        "active",
        100,
    )
    mock_repo.get_active_models.return_value = [
        (2, "model", "1.0.0", "/path", "active", 100)
    ]
    mock_model_service = Mock()
    mock_model_service.loaded_models = {"1.0.0": object(), "2.0.0": object()}
    dm = DeploymentManager(repository=mock_repo, model_service=mock_model_service)
    result = dm.rollback("1.0.0")
    assert result is True
    mock_repo.rollback_model.assert_called_once_with("1.0.0")
    mock_model_service.load_model.assert_called_once_with("1.0.0", "/path")
    # Check that "2.0.0" was unloaded because it's not active
    mock_model_service.unload_model.assert_called_with("2.0.0")


def test_promote(mocker):
    mock_repo = Mock()
    mock_repo.get_active_models.return_value = [
        (1, "model", "1.0.0", "/path", "active", 20),
        (2, "model", "2.0.0", "/path", "active", 80),
    ]
    dm = DeploymentManager(repository=mock_repo)
    dm.promote("1.0.0")
    calls = [mocker.call("1.0.0", 100), mocker.call("2.0.0", 0)]
    mock_repo.update_traffic_weight.assert_has_calls(calls, any_order=True)


def test_drain(mocker):
    mock_repo = Mock()
    mock_model_service = Mock()
    mock_model_service.loaded_models = {"1.0.0": object()}
    dm = DeploymentManager(repository=mock_repo, model_service=mock_model_service)
    dm.drain("1.0.0")
    mock_repo.update_traffic_weight.assert_called_once_with("1.0.0", 0)
    mock_repo.update_status_by_version.assert_called_once_with("1.0.0", "inactive")
    mock_model_service.unload_model.assert_called_once_with("1.0.0")
