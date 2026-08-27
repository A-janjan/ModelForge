import time

from app.services.metrics_service import ERROR_COUNT, REQUEST_COUNT, REQUEST_LATENCY
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class MetricssMiddleware(BaseHTTPMiddleware):
    """
    Middleware to track metrics for each request.
    """

    async def dispatch(self, request: Request, call_next):
        method = request.method
        endpoint = request.url.path

        start_time = time.time()
        response: Response = await call_next(request)
        duration = time.time() - start_time

        response_status = response.status_code

        # update metrics
        REQUEST_COUNT.labels(
            method=method, endpoint=endpoint, status=response_status
        ).inc()
        REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)

        if response_status >= 400:
            ERROR_COUNT.labels(
                method=method, endpoint=endpoint, status=response_status
            ).inc()
        return response
