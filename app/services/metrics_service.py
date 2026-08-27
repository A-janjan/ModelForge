import time

from prometheus_client import REGISTRY, Counter, Gauge, Histogram, generate_latest

# Metrics definitions
REQUEST_COUNT = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
)

ERROR_COUNT = Counter(
    "http_errors_total",
    "Total HTTP errors (4xx, 5xx)",
    ["method", "endpoint", "status"],
)

CACHE_HIT = Counter("cache_hits_total", "Number of cache hits", ["model_version"])

CACHE_MISS = Counter("cache_misses_total", "Number of cache misses", ["model_version"])

ACTIVE_MODELS = Gauge("active_models_count", "Number of active models currently loaded")


DRIFT_SCORE = Gauge(
    "model_drift_score", "Average PSI drift score per model version", ["model_version"]
)


def track_latency(method: str, endpoint: str):
    """
    Context manager to measure latency.
    Usage:
        with track_latency("POST", "/predict"):
            # do something
    """
    start = time.time()
    try:
        yield
    finally:
        duration = time.time() - start
        REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)


def increment_requests(method: str, endpoint: str, status: int):
    REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=status).inc()
    if status >= 400:
        ERROR_COUNT.labels(method=method, endpoint=endpoint, status=status).inc()


def cache_hit(version: str):
    CACHE_HIT.labels(model_version=version).inc()


def cache_miss(version: str):
    CACHE_MISS.labels(model_version=version).inc()


def set_active_models(count: int):
    ACTIVE_MODELS.set(count)


def set_drift_score(version: str, score: float):
    DRIFT_SCORE.labels(model_version=version).set(score)


def get_metrics():
    """Return the latest metrics for Prometheus scraping."""
    return generate_latest(REGISTRY)
