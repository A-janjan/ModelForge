from fastapi import APIRouter, HTTPException, status, Depends

from app.repositories.model_repository import ModelRepository
from app.schemas.model import (
    ModelCreate,
    UpdateWeightRequest,
    ModelResponse,
    StatusUpdateResponse,
)
from app.middleware.rate_limit import check_rate_limit
from app.services.model_service import ModelService
from app.services.deployment_manager import DeploymentManager

import logging

logging.basicConfig(level=logging.INFO)

router = APIRouter(dependencies=[Depends(check_rate_limit)])
model_repository = ModelRepository()

# Create a shared ModelService instance (can be reused)
model_service = ModelService()  # This loads all active models at startup

deployment_manager = DeploymentManager(
    repository=model_repository, model_service=model_service
)


@router.post(
    "/admin/models",
    status_code=status.HTTP_201_CREATED,
    response_model=dict[str, str | tuple],
)
def register_model(model: ModelCreate) -> dict[str, str | tuple]:
    """
    Register a new model version.
    """
    model_data = model.model_dump()
    created = model_repository.create_model(**model_data)
    if created is None:
        raise HTTPException(status_code=400, detail="Failed to create model")
    return {"status": "success", "model": created}


@router.get("/admin/models", response_model=list[ModelResponse])
def get_models() -> list[ModelResponse]:
    """
    List all models with version and status.
    """
    models = model_repository.list_models()
    return [
        ModelResponse(
            id=m[0],
            name=m[1],
            version=m[2],
            artifact_path=m[3],
            status=m[4],
            traffic_weight=m[5],
        )
        for m in models
    ]


@router.put("/admin/models/{version}/weight", response_model=StatusUpdateResponse)
def update_model_weight(
    version: str, payload: UpdateWeightRequest
) -> StatusUpdateResponse:
    """
    Update traffic weight for a given model version.
    """
    updated = model_repository.update_traffic_weight(version, payload.traffic_weight)
    if not updated:
        raise HTTPException(status_code=404, detail="Model version not found")
    return StatusUpdateResponse(status="success")


@router.put("/admin/models/{version}/status", response_model=StatusUpdateResponse)
def update_model_status_by_version(version: str, status: str) -> StatusUpdateResponse:
    """
    Update status (active/inactive) for a given model version.
    """
    if status.lower() not in {"pending", "active", "inactive", "archived", "failed"}:
        raise HTTPException(status_code=400, detail="Invalid status value")
    updated = model_repository.update_status_by_version(version, status)
    if not updated:
        raise HTTPException(status_code=404, detail="Model version not found")

    if status.lower() == "active":
        model_row = model_repository.get_model_by_version(version=version)
        if model_row is None:
            raise HTTPException(
                status_code=404, detail="Model version not found after status update"
            )

        artifact_path = model_row[3]
        try:
            model_service.load_model(version=version, path=artifact_path)
        except Exception as e:
            raise HTTPException(500, f"failed to load model: {e}")
    elif status.lower() in ("inactive", "archived", "failed"):
        if version in model_service.loaded_models:
            model_service.unload_model(version=version)

    return StatusUpdateResponse(status="success")


@router.put("/admin/models/{model_id}", response_model=StatusUpdateResponse)
def update_model_status_by_id(
    model_id: int, payload: dict[str, str]
) -> StatusUpdateResponse:
    """
    Update status (active/inactive) for a given model by its database ID.
    """
    status_value = payload.get("status")
    if status_value not in ("pending", "active", "inactive", "archived", "failed"):
        raise HTTPException(status_code=400, detail="Invalid status value")
    updated = model_repository.update_status_by_id(model_id, status_value)
    if not updated:
        raise HTTPException(status_code=404, detail="Model not found")
    return StatusUpdateResponse(status="success")


@router.put("/admin/models/{version}/rollback", response_model=StatusUpdateResponse)
def rollback_model(version: str) -> StatusUpdateResponse:
    """
    Emergency rollback: deactivates all later versions and activates this one.
    """
    rolled = model_repository.rollback_model(version)
    if not rolled:
        raise HTTPException(status_code=404, detail="Model version not found")
    return StatusUpdateResponse(status="success")


@router.get("/admin/models/{model_id}", response_model=ModelResponse)
def get_model_by_id(model_id: int) -> ModelResponse:
    """
    Retrieve full model record by its database ID.
    """
    model = model_repository.get_model_by_id(model_id)
    if model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    return ModelResponse(
        id=model[0],
        name=model[1],
        version=model[2],
        artifact_path=model[3],
        status=model[4],
        traffic_weight=model[5],
    )


@router.delete("/admin/models/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_model(model_id: int) -> None:
    """
    Delete a model record by its database ID.
    """
    deleted = model_repository.delete_model(model_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Model not found")
    return None


@router.get("/admin/models/version/{version}", response_model=ModelResponse)
def get_model_by_version(version: str) -> ModelResponse:
    """
    Retrieve full model record by its version.
    """
    model = model_repository.get_model_by_version(version)
    if model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    return ModelResponse(
        id=model[0],
        name=model[1],
        version=model[2],
        artifact_path=model[3],
        status=model[4],
        traffic_weight=model[5],
    )


@router.post("/admin/deploy")
def deploy(payload: ModelCreate):
    record = deployment_manager.deploy_model(
        name=payload.name,
        version=payload.version,
        artifact_path=payload.artifact_path,
        status=payload.status,
        traffic_weight=payload.traffic_weight,
    )
    return ModelResponse(
        id=record[0],
        name=record[1],
        version=record[2],
        artifact_path=record[3],
        status=record[4],
        traffic_weight=record[5],
    )


@router.post("/admin/promote/{version}")
def promote(version: str):
    deployment_manager.promote(version)
    StatusUpdateResponse(status="success")


@router.post("/admin/drain/{version}")
def drain(version: str):
    deployment_manager.drain(version)
    StatusUpdateResponse(status="success")
