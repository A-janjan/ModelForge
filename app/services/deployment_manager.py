import logging
from app.repositories.model_repository import ModelRepository
from app.services.model_service import ModelService

logger = logging.getLogger(__name__)


class DeploymentManager:
    def __init__(
        self,
        repository: ModelRepository | None = None,
        model_service: ModelService | None = None,
    ):
        self.repository = repository or ModelRepository()
        self.model_service = model_service or ModelService()

    def deploy_model(
        self,
        name: str,
        version: str,
        artifact_path: str,
        status: str = "active",
        traffic_weight: int = 100,
    ):
        """
        Register a new model version and optionally activate it.
        Returns the created record.
        """
        created_row = self.repository.create_model(
            name, version, artifact_path, status, traffic_weight
        )
        if created_row is None:
            raise ValueError("failed to create model record in DB")

        if status.lower() == "active":
            try:
                self.model_service.load_model(version, artifact_path)
            except Exception as e:
                logger.error(f"failed to load model {version}: {e}")
                raise

        return created_row

    def rollback(self, target_version: str) -> bool:
        """
        Roll back to a specific version. Deactivates all others, activates target.
        Returns True on success.
        """
        # Use repository's rollback (which sets statuses)
        success = self.repository.rollback_model(target_version)
        if not success:
            return False

        # Now load the target version (if not already)
        target_record = self.repository.get_model_by_version(target_version)
        if target_record is None:
            return False
        artifact_path = target_record[3]
        try:
            self.model_service.load_model(target_version, artifact_path)
        except Exception as e:
            logger.error(
                f"failed to load target version {target_version} during rollback: {e}"
            )

        # unload any other versions that are no longer active (optional)
        active_models = self.repository.get_active_models()
        loaded_models = self.model_service.loaded_models
        for v in loaded_models:
            if v != target_version and not any(v == row[2] for row in active_models):
                try:
                    self.model_service.unload_model(v)
                except Exception as e:
                    logger.warning("failed to unload version {v}: {e}")
        return True

    def promote(self, version: str):
        """
        Give 100% traffic to the given version, 0% to all others.
        """
        # Get all active models
        active_models = self.repository.get_active_models()
        for model in active_models:
            v = model[2]
            weight = 100 if v == version else 0
            self.repository.update_traffic_weight(v, weight)

    def drain(self, version: str):
        """
        Set traffic weight to 0 for the version, then deactivate it.
        """
        self.repository.update_traffic_weight(version, 0)
        self.repository.update_status_by_version(version, "inactive")
        if version in self.model_service.loaded_models:
            self.model_service.unload_model(version)
