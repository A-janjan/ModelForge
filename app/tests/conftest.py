import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.middleware.api_key_auth import validate_api_key


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
