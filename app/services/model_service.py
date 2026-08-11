import joblib
import numpy as np


class ModelService:
    MODEL_VERSION = "1.0.0"

    def __init__(self) -> None:
        self.model = joblib.load("app/models/iris_model.pkl")

    def predict(
        self,
        sepal_length: float,
        sepal_width: float,
        petal_length: float,
        petal_width: float,
    ) -> str:
        features = np.array([[sepal_length, sepal_width, petal_length, petal_width]])

        prediction = self.model.predict(features)

        return str(prediction[0])
