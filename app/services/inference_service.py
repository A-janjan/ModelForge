import logging

from app.repositories.model_repository import ModelRepository
from app.services.cache_service import CacheService
from app.services.metrics_service import cache_hit, cache_miss
from app.services.model_service import ModelService
from app.services.traffic_router import TrafficRouter

logger = logging.getLogger(__name__)


class InferenceService:
    def __init__(
        self,
        router: TrafficRouter | None = None,
        model_service: ModelService | None = None,
        model_repository: ModelRepository | None = None,
        cache_service: CacheService | None = None,
    ):
        router = router if router is not None else TrafficRouter()
        model_service = model_service if model_service is not None else ModelService()
        model_repository = (
            model_repository if model_repository is not None else ModelRepository()
        )

        self.router: TrafficRouter = router
        self.model_service: ModelService = model_service
        self.model_repository: ModelRepository = model_repository

        self.cache_service: CacheService = (
            cache_service if cache_service is not None else CacheService()
        )

    def predict(self, features: list[float]) -> dict[str, str]:
        active_models = self.model_repository.get_active_models()
        if not active_models:
            raise ValueError("No active models available for inference")

        router_input = {
            row[2]: row[5] for row in active_models
        }  # model_version: model_weight

        selected_version = self.router.select_model(router_input)

        if not selected_version:
            raise ValueError("No model selected, something went wrong")

        # -- CACHE CHECK --
        cache_key = self.cache_service.generate_cache_key(selected_version, features)
        cached_prediction = self.cache_service.get(cache_key)
        if cached_prediction is not None:
            cache_hit(selected_version)
            return {"prediction": cached_prediction, "model_version": selected_version}
        cache_miss(selected_version)
        # -- CHACHE MISS --
        prediction = self.model_service.predict(selected_version, features)
        logger.info(
            "Prediction requested", extra={"version": selected_version, "cache": "miss"}
        )
        # store in cache for future requests
        self.cache_service.set(cache_key, prediction)
        return {"prediction": prediction, "model_version": selected_version}
