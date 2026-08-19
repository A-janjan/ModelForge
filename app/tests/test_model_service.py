import pytest  # pyright: ignore[reportMissingImports]

from app.services.model_service import ModelService


# test 1
def test_predict():
    model_service = ModelService()
    prediction = model_service.predict("1.0.0", [5.1, 3.5, 1.4, 0.2])
    assert prediction is not None
    assert isinstance(prediction, str)


# test 2
def test_predict_version_missing():
    model_service = ModelService()
    with pytest.raises(ValueError):  # pyright: ignore[reportUnknownMemberType]
        _ = model_service.predict("999.0.0", [5.1, 3.5, 1.4, 0.2])
