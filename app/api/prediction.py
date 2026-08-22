from fastapi import APIRouter

from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.inference_service import InferenceService

router: APIRouter = APIRouter()  # pyright: ignore[reportUnknownVariableType]
inference_service = InferenceService()


@router.get("/health")  # pyright: ignore[reportUntypedFunctionDecorator, reportUnknownMemberType]
def health():
    return {"status": "healthy"}


@router.get("/model/info")  # pyright: ignore[reportUntypedFunctionDecorator, reportUnknownMemberType]
def model_info():
    return {"name": "iris-classifier", "version": "1.0.0"}


@router.post("/predict", response_model=PredictionResponse)  # pyright: ignore[reportUntypedFunctionDecorator, reportUnknownMemberType]
def predict(request: PredictionRequest):
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
