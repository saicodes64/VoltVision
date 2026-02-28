"""
Anomaly Detection Service — wraps the pre-trained Isolation Forest model.

The IF model was trained on the UCI Household Energy dataset with features:
  [Global_active_power_mean, Global_active_power_max, Voltage_mean, Global_intensity_max]

We derive these from the uploaded actual_kwh data:
  - Global_active_power_mean  → rolling 3h mean of actual_kwh (scaled to kW)
  - Global_active_power_max   → rolling 3h max of actual_kwh
  - Voltage_mean              → fixed reasonable household voltage (230V / scaled)
  - Global_intensity_max      → derived from power / voltage

Fallback: Z-score based detection when model fails.
"""

import joblib
import numpy as np
import warnings
from typing import List, Dict
from pathlib import Path

from app.core.config import RF_MODEL_PATH

IF_MODEL_PATH = RF_MODEL_PATH.parent / "isolation_forest_anomaly.pkl"

# Feature names the model was trained with (UCI dataset derived)
FEATURE_NAMES = [
    "Global_active_power_mean",
    "Global_active_power_max",
    "Voltage_mean",
    "Global_intensity_max",
]

VOLTAGE_NOMINAL = 0.9       # normalised ~230V in model's scale
CURRENT_SCALE   = 0.04      # approximate scaling factor from kWh to amps


class AnomalyService:
    """Wraps the Isolation Forest model for energy anomaly detection."""

    def __init__(self):
        self.model = None
        self.model_loaded = False
        self._load_model()

    def _load_model(self):
        try:
            if IF_MODEL_PATH.exists():
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    self.model = joblib.load(str(IF_MODEL_PATH))
                self.model_loaded = True
                print(f"[AnomalyService] ✅ Isolation Forest loaded from {IF_MODEL_PATH}")
            else:
                print(f"[AnomalyService] ⚠️ Model not found at {IF_MODEL_PATH}")
        except Exception as e:
            print(f"[AnomalyService] ❌ Failed to load model: {e}")
            self.model_loaded = False

    def detect(self, hourly_data: List[Dict]) -> List[Dict]:
        """
        Detect anomalies in a list of hourly energy records.
        Returns records enriched with: is_anomaly, anomaly_score, severity.
        """
        if not hourly_data:
            return []

        values = [float(r.get("actual_kwh", 0.0)) for r in hourly_data]
        features = self._build_features(values)

        scores, preds = self._run_model(features, values)

        results = []
        for i, record in enumerate(hourly_data):
            score   = scores[i]
            is_anom = preds[i] == -1
            # Map raw decision score to 0-1 where 1 = most anomalous
            norm = max(0.0, min(1.0, 0.5 - score))
            severity = ("high" if norm > 0.6 else "medium") if is_anom else "normal"
            results.append({
                **record,
                "is_anomaly"    : is_anom,
                "anomaly_score" : round(norm, 4),
                "severity"      : severity,
            })
        return results

    def _build_features(self, values: List[float]) -> List[List[float]]:
        """Map actual_kwh values → 4 UCI-derived features expected by the IF model."""
        features = []
        for i, kwh in enumerate(values):
            window = values[max(0, i - 2): i + 1]
            p_mean = float(np.mean(window))
            p_max  = float(np.max(window))
            v_mean = VOLTAGE_NOMINAL
            i_max  = p_max * CURRENT_SCALE
            features.append([p_mean, p_max, v_mean, i_max])
        return features

    def _run_model(self, features: List[List[float]], values: List[float]):
        """Run the IF model or fall back to Z-score detection."""
        if self.model_loaded and self.model is not None:
            try:
                import pandas as pd
                X = pd.DataFrame(features, columns=FEATURE_NAMES)
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    scores = self.model.decision_function(X).tolist()
                    preds  = self.model.predict(X).tolist()
                return scores, preds
            except Exception as e:
                print(f"[AnomalyService] ⚠️ Model predict failed, using Z-score fallback: {e}")

        # Z-score fallback
        arr  = np.array(values, dtype=float)
        mean = float(np.mean(arr))
        std  = float(np.std(arr)) or 1.0
        scores = [-(abs(v - mean) / std) for v in values]
        preds  = [-1 if abs(v - mean) > 2.0 * std else 1 for v in values]
        return scores, preds

    def get_summary(self, results: List[Dict]) -> Dict:
        """Compute summary stats for anomaly results."""
        if not results:
            return {
                "total": 0, "anomaly_count": 0,
                "avg_kwh": 0, "max_kwh": 0,
                "anomaly_percent": 0, "anomaly_hours": [],
            }
        values    = [r.get("actual_kwh", 0.0) for r in results]
        anomalies = [r for r in results if r.get("is_anomaly")]
        return {
            "total"          : len(results),
            "anomaly_count"  : len(anomalies),
            "avg_kwh"        : round(float(np.mean(values)), 2),
            "max_kwh"        : round(float(np.max(values)),  2),
            "anomaly_percent": round(100 * len(anomalies) / max(len(results), 1), 1),
            "anomaly_hours"  : [r.get("label", f"{r.get('hour', 0):02d}:00") for r in anomalies],
        }


# Global singleton
anomaly_service = AnomalyService()
