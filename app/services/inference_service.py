# Coordinate inference workflow.

from app.repositories.model_repository import ModelRepository
from app.services.model_service import ModelService
from app.services.traffic_router import TrafficRouter


class InferenceService:
    def __init__(self):
        self.router: TrafficRouter = TrafficRouter()
        self.model_service: ModelService = ModelService()
        self.model_repository: ModelRepository = ModelRepository()

    def predict(self, features: list[float]) -> tuple[str, str]:
        active_models = (
            self.model_repository.get_active_models()
        )  # it returns: dict[model_version: str, weight: int]
        selected_model_version = self.router.select_model(
            active_models
        )  # it returns model version(str)
        prediction = self.model_service.predict(selected_model_version, features)
        return str(prediction), selected_model_version
