"""
Feature engineering utilities for the Random Forest model.
Creates features from raw hourly data.
"""

import numpy as np
from typing import List, Dict


def engineer_features_for_prediction(hourly_data: List[Dict], target_hours: int = 24) -> np.ndarray:
    """
    Create feature vectors for predicting the next `target_hours` hours.
    
    Features per hour (9 total to match the RF model):
    - hour (0-23)
    - day_of_week (0-6)
    - month (1-12)
    - is_weekend (0/1)
    - rolling_mean_3h
    - prev_usage
    - peak_indicator (1 if 17-22, else 0)
    - hour_sin (cyclical sine encoding of hour)
    - hour_cos (cyclical cosine encoding of hour)
    
    Returns: numpy array of shape (target_hours, n_features)
    """
    from datetime import datetime, timedelta

    if not hourly_data:
        return _generate_default_features(target_hours)

    # Get the last few hours for rolling calculations
    recent = hourly_data[-6:] if len(hourly_data) >= 6 else hourly_data
    recent_values = [h.get("actual_kwh", 2.0) for h in recent]

    # Current timestamp
    last_ts = hourly_data[-1].get("timestamp", datetime.now().isoformat())
    if isinstance(last_ts, str):
        try:
            last_time = datetime.fromisoformat(last_ts)
        except ValueError:
            last_time = datetime.now()
    else:
        last_time = last_ts

    features = []
    for i in range(target_hours):
        target_time = last_time + timedelta(hours=i + 1)
        hour = target_time.hour
        dow = target_time.weekday()
        month = target_time.month
        is_weekend = 1 if dow >= 5 else 0
        peak_indicator = 1 if 17 <= hour <= 22 else 0

        # Rolling mean from recent data
        window = recent_values[max(0, len(recent_values) - 3):]
        rolling_mean = np.mean(window) if window else 2.0

        # Previous usage
        prev_usage = recent_values[-1] if recent_values else 2.0

        # Cyclical hour encoding
        hour_sin = np.sin(2 * np.pi * hour / 24)
        hour_cos = np.cos(2 * np.pi * hour / 24)

        features.append([
            hour,
            dow,
            month,
            is_weekend,
            round(rolling_mean, 3),
            round(prev_usage, 3),
            peak_indicator,
            round(float(hour_sin), 4),
            round(float(hour_cos), 4),
        ])

        # Shift rolling window
        recent_values.append(prev_usage)

    return np.array(features)


def _generate_default_features(target_hours: int = 24) -> np.ndarray:
    """Generate default features when no data is available."""
    from datetime import datetime, timedelta

    now = datetime.now()
    features = []
    for i in range(target_hours):
        t = now + timedelta(hours=i + 1)
        hour = t.hour
        features.append([
            hour,
            t.weekday(),
            t.month,
            1 if t.weekday() >= 5 else 0,
            2.5,  # default rolling mean
            2.5,  # default prev usage
            1 if 17 <= hour <= 22 else 0,
            round(float(np.sin(2 * np.pi * hour / 24)), 4),
            round(float(np.cos(2 * np.pi * hour / 24)), 4),
        ])
    return np.array(features)


def get_feature_names() -> List[str]:
    """Return the feature names expected by the model."""
    return [
        "hour",
        "day_of_week",
        "month",
        "is_weekend",
        "rolling_mean_3h",
        "prev_usage",
        "peak_indicator",
        "hour_sin",
        "hour_cos",
    ]
