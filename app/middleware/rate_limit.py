import os
import redis
from fastapi import Request, Depends, HTTPException, status
from app.middleware.api_key_auth import validate_api_key


class RateLimiter:
    """
    Redis-based rate limiter using a fixed window counter.
    """

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

        self.limit = int(
            os.getenv("RATE_LIMIT_PER_MINUTE", 5)
        )  # Default to 100 requests
        self.window_seconds = 60  # 1 minute window

    def check_rate_limit(self, api_key: str, endpoint: str) -> bool:
        """
        Check if the request is allowed under the current rate limit.
        Returns True if allowed, False if rate limit exceeded.
        """
        key = f"rate_limit:{api_key}:{endpoint}"
        current = self.redis_client.incr(key)
        if current == 1:
            self.redis_client.expire(key, self.window_seconds)
        return current <= self.limit


# Singleton instance (will be created lazily)
_rate_limiter = None


def get_rate_limiter() -> RateLimiter:
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter


async def check_rate_limit(
    request: Request,
    api_key: str = Depends(validate_api_key),
    limit: RateLimiter = Depends(get_rate_limiter),
) -> str:
    """
    FastAPI dependency that checks the rate limit and raises HTTP 429 if exceeded.
    Returns the api_key (so it can be used downstream if needed).
    """
    # Use the full request path as the endpoint identifier
    endpoint = request.url.path
    if not limit.check_rate_limit(api_key, endpoint):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
        )
    return api_key
