from fastapi import FastAPI, Response

from app.api.admin import router as admin_router
from app.api.prediction import router
from app.middleware.metrics_middleware import MetricssMiddleware
from app.middleware.correlation_id import CorrelationIdMiddleware
from app.services.metrics_service import get_metrics
from app.services.logging_service import setup_logging

_ = setup_logging()

app = FastAPI(title="ModelForege", version="1.0.0")

app.include_router(router)
app.include_router(admin_router)

app.add_middleware(MetricssMiddleware)
app.add_middleware(CorrelationIdMiddleware)


@app.get("/metrics")
async def metrics():
    """
    Endpoint to expose Prometheus metrics.
    """
    return Response(content=get_metrics(), media_type="text/plains")
