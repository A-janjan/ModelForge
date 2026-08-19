import joblib  # pyright: ignore[reportMissingImports]

from app.repositories.model_repository import ModelRepository


class ModelService:
    def __init__(self):
        self.model_repository: ModelRepository = ModelRepository()
        self.loaded_models: dict[str, object] = {}
        self.load_models()

    def load_models(self):
        active_models = self.model_repository.get_active_models()
        for model_version in active_models:
            version = model_version[0]
            self.load_model(version, f"app/models/iris_model_{version}.pkl")

    def load_model(self, version: str, path: str):
        self.loaded_models[version] = joblib.load(path)  # pyright: ignore[reportUnknownMemberType]

    def unload_model(self, version: str):
        del self.loaded_models[version]

    def predict(self, version: str, features: list[float]) -> str:
        if version not in self.loaded_models:
            raise ValueError(f"Model version {version} is not loaded")
        model = self.loaded_models[version]
        prediction = model.predict(  # pyright: ignore[reportUnknownMemberType, reportUnknownVariableType, reportAttributeAccessIssue]
            [features]
        )  # because sklearn expects: 2D array; not like [5.1, 3.5, 1.4, 0.2]
        return str(prediction)  # pyright: ignore[reportUnknownArgumentType]
