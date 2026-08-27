from fastapi import APIRouter, BackgroundTasks, Depends  # type: ignore

from app.middleware.rate_limit import check_rate_limit
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.drift_detector import get_drift_detector
from app.services.inference_service import InferenceService

router: APIRouter = APIRouter()
inference_service = InferenceService()


@router.get("/health")
def health():
    return {"status": "healthy"}


@router.post("/predict", response_model=PredictionResponse)
def predict(
    request: PredictionRequest,
    background_tasks: BackgroundTasks,
    _: str = Depends(check_rate_limit),
):
    features = [
        request.sepal_length,
        request.sepal_width,
        request.petal_length,
        request.petal_width,
    ]
    prediction = inference_service.predict(features)

    version = prediction["model_version"]
    background_tasks.add_task(
        get_drift_detector().collect_sample, version=version, features=features
    )

    return PredictionResponse(
        prediction=prediction["prediction"], model_version=prediction["model_version"]
    )
