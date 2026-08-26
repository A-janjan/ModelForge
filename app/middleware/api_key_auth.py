# Responsibility: Validate API keys.
import os

from dotenv import load_dotenv
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

# Load environment variables from .env file (does not override real env vars)
_ = load_dotenv()

# Define the header name
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

# Read the valid key from environment/.env (or use a default for development)
VALID_API_KEY = os.getenv("MODELFORGE_API_KEY", "dev-api-key-123")


def validate_api_key(api_key: str = Security(api_key_header)):
    """
    Dependency that validates the API key.
    Raises HTTP 401 if missing or invalid.
    """
    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API Key",
            headers={"WWW-Authenticate": "APIKey"},
        )
    if api_key != VALID_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
            headers={"WWW-Authenticate": "APIKey"},
        )
    return api_key


