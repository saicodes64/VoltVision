"""
Forecasting service — loads the Random Forest model and produces predictions.
Falls back to pattern-based simulation if model fails.
"""

import joblib
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional

from app.core.config import RF_MODEL_PATH
from app.utils.feature_engineering import engineer_features_for_prediction, get_feature_names


class ForecastingService:
    """Manages the RF model and produces energy forecasts."""

    def __init__(self):
        self.model = None
        self.model_loaded = False
        self._load_model()

    def _load_model(self):
        """Load the trained Random Forest model from disk."""
        try:
            if RF_MODEL_PATH.exists():
                self.model = joblib.load(str(RF_MODEL_PATH))
                self.model_loaded = True
                print(f"[ForecastingService] ✅ Model loaded from {RF_MODEL_PATH}")

                # Check expected features
                if hasattr(self.model, "n_features_in_"):
                    print(f"[ForecastingService] Model expects {self.model.n_features_in_} features")
                    expected = self.model.n_features_in_
                    our_features = len(get_feature_names())
                    if expected != our_features:
                        print(f"[ForecastingService] ⚠️ Feature mismatch: model expects {expected}, we provide {our_features}")
                        print(f"[ForecastingService] Will use fallback predictions")
                        self.model_loaded = False
            else:
                print(f"[ForecastingService] ⚠️ Model not found at {RF_MODEL_PATH}")
        except Exception as e:
            print(f"[ForecastingService] ❌ Failed to load model: {e}")
            self.model = None
            self.model_loaded = False

    def predict_next_24h(self, hourly_data: List[Dict]) -> List[float]:
        """
        Predict energy usage for the next 24 hours.
        Returns list of 24 predicted kWh values.
        """
        if self.model_loaded and self.model is not None:
            try:
                features = engineer_features_for_prediction(hourly_data, target_hours=24)
                predictions = self.model.predict(features)
                # Clamp predictions to reasonable range
                predictions = np.clip(predictions, 0.1, 15.0)
                return [round(float(p), 2) for p in predictions]
            except Exception as e:
                print(f"[ForecastingService] ⚠️ Prediction failed, using fallback: {e}")

        # Fallback: pattern-based prediction with slight noise
        return self._fallback_predictions(hourly_data)

    def _fallback_predictions(self, hourly_data: List[Dict]) -> List[float]:
        """Generate fallback predictions based on historical pattern."""
        base_pattern = [
            0.8, 0.6, 0.5, 0.4, 0.5, 0.7,
            1.2, 2.1, 2.8, 3.2, 3.0, 2.6,
            2.4, 2.2, 2.5, 2.8, 3.5, 4.2,
            4.8, 4.5, 3.8, 2.9, 1.8, 1.1,
        ]

        if hourly_data and len(hourly_data) >= 24:
            # Use last 24h actual data as base, with slight variation
            recent = hourly_data[-24:]
            predictions = []
            for h in recent:
                actual = h.get("actual_kwh", base_pattern[h.get("hour", 0)])
                noise = np.random.normal(0, 0.15)
                pred = max(0.1, actual + noise)
                predictions.append(round(pred, 2))
            return predictions
        else:
            return [round(v + np.random.normal(0, 0.2), 2) for v in base_pattern]


# Global instance
forecasting_service = ForecastingService()
