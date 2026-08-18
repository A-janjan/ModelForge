from fastapi import APIRouter

from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.inference_service import InferenceService

router = APIRouter()
model_service = InferenceService()


@router.get("/health")
def health():
    return {"status": "healthy"}


@router.get("/model/info")
def model_info():
    return {"name": "iris-classifier", "version": "1.0.0"}


@router.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    prediction = model_service.predict(
        request.sepal_length,
        request.sepal_width,
        request.petal_length,
        request.petal_width,
    )

    return PredictionResponse(prediction=prediction, model_version="1.0.0")
