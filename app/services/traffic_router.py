# Choose which model version receives a request.
import random


class TrafficRouter:
    def __init__(self):
        pass

    def select_model(self, active_models: dict[str, int]) -> str:
        if not active_models:
            raise ValueError("active_models must not be empty")

        # active models: e.g.: {'v1': 10, 'v2': 20, 'v3': 30}
        total_weight = sum(weight for _, weight in active_models.items())
        random_number = random.randint(0, total_weight - 1)
        routing_total = 0
        for model_version, weight in active_models.items():
            routing_total += weight
            if random_number <= routing_total:
                return model_version

        raise RuntimeError("No model selected, something went wrong")
