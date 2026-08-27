import pytest
from app.main import app
from app.middleware.api_key_auth import validate_api_key
from app.middleware.rate_limit import check_rate_limit
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def override_api_key():
    """
    Override the validate_api_key dependency to always return a valid key for testing.
    This allows tests to bypass API key validation.
    """
    app.dependency_overrides[validate_api_key] = lambda: "test-api-key"
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    """
    Fixture to provide a TestClient instance for testing the FastAPI app.
    """
    return TestClient(app)


@pytest.fixture(autouse=True)
def override_rate_limit():
    """Override the rate limiter dependency to always pass."""

    async def mock_check_rate_limit():
        return "test-api-key"

    app.dependency_overrides[check_rate_limit] = mock_check_rate_limit
    yield
    app.dependency_overrides.pop(check_rate_limit, None)
