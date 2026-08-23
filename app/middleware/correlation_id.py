import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.types import ASGIApp
import contextvars

CORRELATION_ID_HEADER = "X-Correlation-ID"

correlation_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "correlation_id", default=None
)


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        corr_id = request.headers.get(CORRELATION_ID_HEADER)
        if not corr_id:
            corr_id = str(uuid.uuid4())
        token = correlation_id_var.set(corr_id)
        request.state.correlation_id = corr_id
        response = await call_next(request)
        response.headers[CORRELATION_ID_HEADER] = corr_id
        correlation_id_var.reset(token)
        return response
