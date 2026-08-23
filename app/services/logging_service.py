import logging
import sys
from pythonjsonlogger.json import JsonFormatter
from app.middleware.correlation_id import correlation_id_var


def setup_logging():
    """Configure root logger to output JSON with correlation_id."""
    logger = logging.getLogger()
    handler = logging.StreamHandler(sys.stdout)
    formatter = JsonFormatter(  # type: ignore
        fmt="%(asctime)s %(name)s %(levelname)s %(correlation_id)s %(message)s",
        rename_fields={"levelname": "severity", "asctime": "timestamp"},
    )
    handler.setFormatter(formatter)
    handler.addFilter(CorrelationIdFilter())
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger


class CorrelationIdFilter(logging.Filter):
    def filter(self, record):
        record.correlation_id = correlation_id_var.get() or "no-id"
        return True
