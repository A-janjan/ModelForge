from app.repositories.model_repository import ModelRepository
from app.services.model_service import ModelService
from app.services.traffic_router import TrafficRouter


class InferenceService:
    def __init__(self):
        self.router: TrafficRouter = TrafficRouter()
        self.model_service: ModelService = ModelService()
        self.model_repository: ModelRepository = ModelRepository()

    def predict(self, features: list[float]) -> dict[str, str]:
        active_models = self.model_repository.get_active_models()
        if not active_models:
            raise ValueError("No active models available for inference")

        router_input = {
            row[1]: row[4] for row in active_models
        }  # model_version: model_weight

        selected_version = self.router.select_model(router_input)

        if not selected_version:
            raise ValueError("No model selected, something went wrong")
        
        prediction = self.model_service.predict(selected_version, features)
        return {"prediction": prediction, "model_version": selected_version}
