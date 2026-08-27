import pytest  # type: ignore
import numpy as np  # type: ignore
from app.services.drift_detector import DriftDetector


def test_compute_baseline(tmp_path):
    detector = DriftDetector(baseline_dir=str(tmp_path))
    features = [[1.0, 2.0], [1.1, 2.1], [0.9, 1.9]]
    stats = detector.compute_baseline("v1", features)
    assert "mean" in stats
    assert stats["mean"] == pytest.approx([1.0, 2.0], rel=1e-2)


def test_psi():
    detector = DriftDetector()
    expected = [10, 10, 10]
    observed = [5, 15, 10]
    psi = detector.compute_psi(expected, observed)
    # Expected value can be computed manually; we just check it's positive
    assert psi > 0


def test_drift_detection(tmp_path):
    detector = DriftDetector(baseline_dir=str(tmp_path))
    # Baseline: normal distribution
    baseline = np.random.normal(0, 1, (1000, 2)).tolist()
    detector.compute_baseline("v1", baseline)

    # No drift: same distribution
    samples = np.random.normal(0, 1, (100, 2)).tolist()
    result = detector.detect_drift("v1", samples)
    assert result["drift_detected"] is False

    # Drift: shifted distribution
    samples_drift = np.random.normal(2, 1, (100, 2)).tolist()
    result = detector.detect_drift("v1", samples_drift)
    assert result["drift_detected"] is True
