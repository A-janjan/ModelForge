import os
import time

import pytest  # pyright: ignore[reportMissingImports]

from app.repositories.model_repository import ModelRepository
from app.services.model_service import ModelService


def test_predict():
    # Setup: create a model in the database with a unique version.
    repo = ModelRepository()
    version = f"test_{int(time.time())}"  # unique to avoid collisions
    artifact_path = "models/iris_model.pkl"  # assume this file exists

    # Ensure the artifact exists; skip test if missing (optional)
    if not os.path.exists(artifact_path):
        pytest.skip(f"Artifact file {artifact_path} not found; run training first.")

    # Insert the model record
    record = repo.create_model(
        name="iris",
        version=version,
        artifact_path=artifact_path,
        status="active",
        traffic_weight=100,
    )
    assert record is not None, "Failed to create test model"
    model_id = record[0]

    try:
        # Instantiate ModelService – it will load all active models,
        # including the one we just created.
        model_service = ModelService()
        prediction = model_service.predict(version, [5.1, 3.5, 1.4, 0.2])
        assert prediction is not None
        assert isinstance(prediction, str)
    finally:
        # Clean up: delete the test model from the database.
        repo.delete_model(model_id)


def test_predict_version_missing():
    model_service = ModelService()
    with pytest.raises(ValueError):  # pyright: ignore[reportUnknownMemberType]
        _ = model_service.predict("999.0.0", [5.1, 3.5, 1.4, 0.2])
