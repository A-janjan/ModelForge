from app.services.inference_service import InferenceService


class TrafficRouter:
    def __init__(self, inference_service) -> None:
        if inference_service is not None:
            self.inference_service = inference_service
        else:
            self.inference_service = InferenceService()

    # Select the model based on the input models weights
    def select_model(self, models):
        """
        input example:
            [
                {
                    "version": "1.0.0",
                    "weight": 90
                },
                {
                    "version": "2.0.0",
                    "weight": 10
                }
            ]

        output: (based on more weight)
            1.0.0
        """
        model_version = max(models, key=lambda x: x['weight'])['version']
        self.inference_service.select_model(model_version)
        return "Model selected: " + model_version
