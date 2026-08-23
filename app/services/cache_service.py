# Responsibility: Read/write prediction cache.

import hashlib
import json
import redis
import os
from dotenv import load_dotenv

_ = load_dotenv()  # Load environment variables from .env file


class CacheService:
    def __init__(self, redis_client=None):
        if redis_client is None:
            redis_host = os.getenv("REDIS_HOST", "localhost")
            redis_port = int(os.getenv("REDIS_PORT", 6379))
            redis_db = int(os.getenv("REDIS_DB", 0))
            self.redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                decode_responses=True,
            )
        else:
            self.redis_client = redis_client

    def generate_cache_key(self, version: str, features: list[float]) -> str:
        """
        Create a deterministic key from version and feature vector.
        """
        # Serialize features to a stable string (e.g., JSON sorted keys)
        feature_str = json.dumps(sorted(features))
        # SHA256 hash the feature string
        hash_object = hashlib.sha256(feature_str.encode())
        payload_hash = hash_object.hexdigest()
        return f"{version}:{payload_hash}"

    def get(self, key: str) -> str | None:
        """Retrieve cached prediction if exists."""
        return self.redis_client.get(key)

    def set(self, key: str, prediction: str, ttl_seconds: int = 3600) -> None:
        """Store prediction with a TTL (default 1 hour)."""
        self.redis_client.set(key, prediction, ex=ttl_seconds)

    def clear(self, version: str) -> None:
        """
        (Optional) Invalidate all cache entries for a specific version.
        Requires scanning keys - can be implemented later.
        """
        pass
