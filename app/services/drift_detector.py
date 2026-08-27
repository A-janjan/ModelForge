import numpy as np  # type: ignore
import json
import os
from collections import defaultdict
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class DriftDetector:
    """
    Detects feature drift for each model version.
    Uses Population Stability Index (PSI) and summary statistics.
    """

    def __init__(self, baseline_dir: str = "baselines/"):
        self.baseline_dir = baseline_dir
        os.makedirs(baseline_dir, exist_ok=True)
        # In-memory cache of baselines: {version: {"mean": [...], "std": [...], "hist": [...]}}
        self.baselines: Dict[str, Dict] = {}
        # Store recent samples for each version (optional)
        self.recent_samples: Dict[str, List[List[float]]] = defaultdict(list)
        self.max_samples = 1000

    def load_baseline(self, version: str) -> Optional[Dict]:
        """Load baseline statistics from disk."""
        path = os.path.join(self.baseline_dir, f"{version}.json")
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
        return None

    def save_baseline(self, version: str, stats: Dict):
        """Store baseline stats to disk."""
        path = os.path.join(self.baseline_dir, f"{version}.json")
        with open(path, "w") as f:
            json.dump(stats, f)
        self.baselines[version] = stats

    def compute_baseline(self, version: str, features: List[List[float]]):
        """
        Compute baseline statistics from a set of feature vectors (e.g., training data).
        Stores: mean, std, min, max, and histograms (bins) for each feature.
        """
        arr = np.array(features)

        bins_per_feature = []
        counts_per_feature = []
        for i in range(arr.shape[1]):
            col = arr[:, i]
            bins = np.quantile(col, np.linspace(0, 1, 11))
            if np.unique(bins).size != bins.size:
                bins = np.linspace(col.min(), col.max(), 11)
            hist, _ = np.histogram(col, bins=bins)
            bins_per_feature.append(bins.tolist())
            counts_per_feature.append(hist.tolist())

        stats = {
            "mean": arr.mean(axis=0).tolist(),
            "std": arr.std(axis=0).tolist(),
            "min": arr.min(axis=0).tolist(),
            "max": arr.max(axis=0).tolist(),
            "hist": {
                "bins": bins_per_feature,  # list of bins per feature
                "counts": counts_per_feature,
            },
        }

        self.save_baseline(version, stats)
        logger.info(f"Baseline computed for version {version}")
        return stats

    def get_baseline(self, version: str) -> Optional[Dict]:
        """Retrieve baseline, loading from disk if needed."""
        if version not in self.baselines:
            stats = self.load_baseline(version)
            if stats:
                self.baselines[version] = stats
        return self.baselines.get(version)

    def collect_sample(self, version: str, features: List[float]):
        """Store a sample for drift monitoring (optional, for online detection)."""
        self.recent_samples[version].append(features)
        if len(self.recent_samples[version]) > self.max_samples:
            self.recent_samples[version].pop(0)

    def compute_psi(self, expected_hist: List[int], observed_hist: List[int]) -> float:
        """
        Compute Population Stability Index between two histograms.
        Both lists must have same length.
        """
        # Add small epsilon to avoid log(0)
        eps = 1e-8
        expected = np.array(expected_hist) + eps
        observed = np.array(observed_hist) + eps
        # Normalize
        expected = expected / expected.sum()
        observed = observed / observed.sum()
        # PSI = sum((observed - expected) * ln(observed / expected))
        psi = np.sum((observed - expected) * np.log(observed / expected))
        return float(psi)

    def detect_drift(self, version: str, sample_features: List[List[float]]) -> Dict:
        """
        Compute drift score for a batch of samples compared to baseline.
        Returns a dict with PSI per feature and overall drift flag.
        """
        baseline = self.get_baseline(version)
        if baseline is None:
            return {"error": "No baseline found for version", "drift_detected": False}
        # Compute observed histograms from samples
        arr = np.array(sample_features)
        n_features = arr.shape[1]
        # We'll use the same bins as baseline (uniform 0-1) but we can adjust
        bins_per_feature = baseline["hist"]["bins"]
        observed_counts = []
        for i in range(n_features):
            values = arr[:, i]
            bins = np.asarray(bins_per_feature[i])
            hist, _ = np.histogram(values, bins=bins)
            hist[0] += np.count_nonzero(values < bins[0])
            hist[-1] += np.count_nonzero(values > bins[-1])
            observed_counts.append(hist.tolist())

        # Compute PSI per feature
        psi_per_feature = []
        for i in range(n_features):
            expected = baseline["hist"]["counts"][i]
            observed = observed_counts[i]
            psi = self.compute_psi(expected, observed)
            psi_per_feature.append(psi)

        threshold = 0.25
        avg_psi = np.mean(psi_per_feature)
        drift_detected = bool(avg_psi > threshold)

        return {
            "version": version,
            "psi_per_feature": psi_per_feature,
            "average_psi": avg_psi,
            "drift_detected": drift_detected,
            "threshold": threshold,
        }

    def get_drift_status(self, version: str) -> Dict:
        """Return drift status using recent samples."""
        samples = self.recent_samples.get(version, [])
        if len(samples) < 50:  # need enough samples
            return {"status": "insufficient_data", "samples": len(samples)}
        return self.detect_drift(version, samples)


_drift_detector = None


def get_drift_detector() -> DriftDetector:
    global _drift_detector
    if _drift_detector is None:
        _drift_detector = DriftDetector()
    return _drift_detector
