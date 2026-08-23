from fastapi import APIRouter, Depends

from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.inference_service import InferenceService
from app.middleware.rate_limit import check_rate_limit

router: APIRouter = APIRouter()
inference_service = InferenceService()


@router.get("/health")
def health():
    return {"status": "healthy"}


@router.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest, _: str = Depends(check_rate_limit)):
    prediction = inference_service.predict(
        [
            request.sepal_length,
            request.sepal_width,
            request.petal_length,
            request.petal_width,
        ]
    )

    return PredictionResponse(
        prediction=prediction["prediction"], model_version=prediction["model_version"]
    )
