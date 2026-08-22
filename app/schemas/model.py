# Schemas for admin operations.
from pydantic import BaseModel


class ModelCreate(BaseModel):
    name: str
    version: str
    artifact_path: str
    status: str
    traffic_weight: int


class UpdateWeightRequest(BaseModel):
    traffic_weight: int