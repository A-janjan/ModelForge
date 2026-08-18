import joblib  # pyright: ignore[reportMissingImports]

from app.repositories.model_repository import ModelRepository


class ModelService:
    def __init__(self):
        model_repository = ModelRepository()
        self.active_models: dict[str, int] = model_repository.get_active_models()
        self.loaded_models: dict[str, object] = {}
        for model_version in self.active_models:
            self.load_model(model_version, f"app/models/iris_model_{model_version}.pkl")

    def load_model(self, version: str, path: str):
        self.loaded_models[version] = joblib.load(path)  # pyright: ignore[reportUnknownMemberType]

    def unload_model(self, version: str):
        del self.loaded_models[version]

    def predict(self, version: str, features: list[float]) -> str:
        model = self.loaded_models[version]
        prediction = model.predict(features)  # pyright: ignore[reportUnknownMemberType, reportUnknownVariableType, reportAttributeAccessIssue]
        return str(prediction)  # pyright: ignore[reportUnknownArgumentType]
