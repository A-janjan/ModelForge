from fastapi import (
    APIRouter,
    HTTPException,
    status,
)  # pyright: ignore[reportMissingImports]

from app.repositories.model_repository import ModelRepository
from app.schemas.model import ModelCreate, UpdateWeightRequest

import logging

logging.basicConfig(level=logging.INFO)

router = APIRouter()
model_repository = ModelRepository()


@router.post("/admin/models", status_code=status.HTTP_201_CREATED)
def register_model(model: ModelCreate) -> dict[str, str | tuple]:
    """
    Register a new model version.
    """
    model_data = model.model_dump()
    created = model_repository.create_model(**model_data)
    if created is None:
        raise HTTPException(status_code=400, detail="Failed to create model")
    return {"status": "success", "model": created}


@router.get("/admin/models")
def get_models() -> list[dict[str, str]]:
    """
    List all models with version and status.
    """
    models = model_repository.list_models()
    return [{"version": m[2], "status": m[4]} for m in models]


@router.put("/admin/models/{version}/weight")
def update_model_weight(version: str, payload: UpdateWeightRequest) -> dict[str, str]:
    """
    Update traffic weight for a given model version.
    """
    updated = model_repository.update_traffic_weight(version, payload.traffic_weight)
    if not updated:
        raise HTTPException(status_code=404, detail="Model version not found")
    return {"status": "success"}


@router.put("/admin/models/{version}/status")
def update_model_status_by_version(version: str, status: str) -> dict[str, str]:
    """
    Update status (active/inactive) for a given model version.
    """
    updated = model_repository.update_status_by_version(version, status)
    if not updated:
        raise HTTPException(status_code=404, detail="Model version not found")
    return {"status": "success"}



@router.put("/admin/models/{model_id}")
def update_model_status_by_id(model_id: int, payload: dict[str, str]) -> dict[str, str]:
    """
    Update status (active/inactive) for a given model by its database ID.
    """
    status_value = payload.get("status")
    if status_value not in ("active", "inactive"):
        raise HTTPException(status_code=400, detail="Invalid status value")
    updated = model_repository.update_status_by_id(model_id, status_value)
    if not updated:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"status": "success"}



@router.put("/admin/models/{version}/rollback")  # path corrected to match tests
def rollback_model(version: str) -> dict[str, str]:
    """
    Emergency rollback: deactivates all later versions and activates this one.
    """
    rolled = model_repository.rollback_model(version)
    if not rolled:
        raise HTTPException(status_code=404, detail="Model version not found")
    return {"status": "success"}


@router.get("/admin/models/{model_id}")
def get_model_by_id(model_id: int) -> tuple:
    """
    Retrieve full model record by its database ID.
    """
    model = model_repository.get_model_by_id(model_id)
    if model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@router.delete("/admin/models/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_model(model_id: int) -> None:
    """
    Delete a model record by its database ID.
    """
    deleted = model_repository.delete_model(model_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Model not found")
    return None


@router.get("/admin/models/version/{version}")
def get_model_by_version(version: str) -> dict[str, str | int]:
    """
    Retrieve full model record by its version.
    """
    model = model_repository.get_model_by_version(version)
    if model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    return {
        "id": model[0],
        "name": model[1],
        "version": model[2],
        "artifact_path": model[3],
        "status": model[4],
        "traffic_weight": model[5],
    }
