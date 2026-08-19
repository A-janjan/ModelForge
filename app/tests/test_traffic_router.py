from unittest.mock import patch

import pytest  # pyright: ignore[reportMissingImports]

from app.services.traffic_router import TrafficRouter


def test_select_model_rejects_empty_models():
    router = TrafficRouter()

    with pytest.raises(ValueError):  # pyright: ignore[reportUnknownMemberType]
        _ = router.select_model({})


def test_select_model_rejects_zero_weight():
    router = TrafficRouter()

    with pytest.raises(ValueError):  # pyright: ignore[reportUnknownMemberType]
        _ = router.select_model(
            {
                "v1": 0,
                "v2": 0,
            }
        )


def test_select_model_selects_v1():
    router = TrafficRouter()

    with patch(
        "app.services.traffic_router.random.randint",
        return_value=5,
    ):
        result = router.select_model(
            {
                "v1": 10,
                "v2": 20,
                "v3": 30,
            }
        )

    assert result == "v1"


def test_select_model_selects_v2():
    router = TrafficRouter()

    with patch(
        "app.services.traffic_router.random.randint",
        return_value=15,
    ):
        result = router.select_model(
            {
                "v1": 10,
                "v2": 20,
                "v3": 30,
            }
        )

    assert result == "v2"


def test_select_model_selects_v3():
    router = TrafficRouter()

    with patch(
        "app.services.traffic_router.random.randint",
        return_value=45,
    ):
        result = router.select_model(
            {
                "v1": 10,
                "v2": 20,
                "v3": 30,
            }
        )

    assert result == "v3"


def test_select_model_v1_upper_boundary():
    router = TrafficRouter()

    with patch(
        "app.services.traffic_router.random.randint",
        return_value=10,
    ):
        result = router.select_model(
            {
                "v1": 10,
                "v2": 20,
                "v3": 30,
            }
        )

    assert result == "v1"


def test_select_model_v2_lower_boundary():
    router = TrafficRouter()

    with patch(
        "app.services.traffic_router.random.randint",
        return_value=11,
    ):
        result = router.select_model(
            {
                "v1": 10,
                "v2": 20,
                "v3": 30,
            }
        )

    assert result == "v2"


def test_select_model_v2_upper_boundary():
    router = TrafficRouter()

    with patch(
        "app.services.traffic_router.random.randint",
        return_value=30,
    ):
        result = router.select_model(
            {
                "v1": 10,
                "v2": 20,
                "v3": 30,
            }
        )

    assert result == "v2"


def test_select_model_v3_lower_boundary():
    router = TrafficRouter()

    with patch(
        "app.services.traffic_router.random.randint",
        return_value=31,
    ):
        result = router.select_model(
            {
                "v1": 10,
                "v2": 20,
                "v3": 30,
            }
        )

    assert result == "v3"


def test_select_model_v3_upper_boundary():
    router = TrafficRouter()

    with patch(
        "app.services.traffic_router.random.randint",
        return_value=60,
    ):
        result = router.select_model(
            {
                "v1": 10,
                "v2": 20,
                "v3": 30,
            }
        )

    assert result == "v3"
