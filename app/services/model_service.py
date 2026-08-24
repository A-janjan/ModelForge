import logging

import joblib

from app.repositories.model_repository import ModelRepository
from app.services.metrics_service import set_active_models

logger = logging.getLogger(__name__)


class ModelService:
    def __init__(self):
        self.model_repository: ModelRepository = ModelRepository()
        self.loaded_models: dict[str, object] = {}
        self.load_models()

    def load_models(self):
        active_models = self.model_repository.get_active_models()
        for model in active_models:
            version = model[2]
            artifact_path = model[3]
            try:
                self.load_model(version, artifact_path)
                set_active_models(len(self.loaded_models))
            except (FileNotFoundError, OSError) as exc:
                # A single registry entry with a missing/corrupt artifact
                # should not prevent the service from starting up.
                logger.warning(
                    "Skipping model version %s: failed to load artifact %s (%s)",
                    version,
                    artifact_path,
                    exc,
                )

    def load_model(self, version: str, path: str):
        self.loaded_models[version] = joblib.load(path)
        set_active_models(len(self.loaded_models))

    def unload_model(self, version: str):
        del self.loaded_models[version]
        set_active_models(len(self.loaded_models))

    def _load_model_on_demand(self, version: str):
        # The in-memory cache is populated at startup and can miss models
        # registered afterwards (e.g. via the admin API). Fall back to
        # loading the artifact on cache-miss instead of failing outright.
        model_row = self.model_repository.get_model_by_version(version)
        if model_row is None:
            raise ValueError(f"Model version {version} is not registered")

        artifact_path = model_row[3]
        try:
            self.load_model(version, artifact_path)
        except (FileNotFoundError, OSError) as exc:
            raise ValueError(
                f"Model version {version} is not loaded: failed to load "
                f"artifact {artifact_path} ({exc})"
            ) from exc

    def predict(self, version: str, features: list[float]) -> str:
        if version not in self.loaded_models:
            self._load_model_on_demand(version)
        model = self.loaded_models[version]
        prediction = model.predict(
            [features]
        )  # because sklearn expects: 2D array; not like [5.1, 3.5, 1.4, 0.2]
        return str(prediction)
