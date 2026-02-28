"""
In-memory data store for uploaded/simulated energy data.
Stores hourly usage data that all services read from.
"""

import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from app.core.config import SIMULATION_DAYS


class DataStore:
    """Singleton in-memory store for energy data."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.hourly_data: List[Dict] = []
        self.raw_df = None
        self.last_upload_time: Optional[datetime] = None

    def set_data(self, data: List[Dict]):
        """Set hourly data from upload or simulation."""
        self.hourly_data = data
        self.last_upload_time = datetime.now()

    def get_latest_24h(self) -> List[Dict]:
        """Get the most recent 24 hours of data."""
        if not self.hourly_data:
            return []
        return self.hourly_data[-24:]

    def get_all_data(self) -> List[Dict]:
        """Get all stored data."""
        return self.hourly_data

    def has_data(self) -> bool:
        return len(self.hourly_data) > 0

    def get_monthly_data(self) -> List[Dict]:
        """Get approximately 30 days of data."""
        return self.hourly_data[-(24 * 30):] if len(self.hourly_data) >= 24 * 30 else self.hourly_data


def generate_simulated_data(days: int = SIMULATION_DAYS) -> List[Dict]:
    """
    Generate realistic simulated hourly energy usage data.
    Models typical Indian household usage patterns.
    """
    data = []
    np.random.seed(42)
    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    start = now - timedelta(days=days)

    # Base hourly usage pattern (kWh) — typical Indian household/hostel
    # Realistic range: 0.3–5.0 kWh/hour, daily total ~20–30 kWh
    base_pattern = [
        0.4, 0.3, 0.25, 0.2, 0.25, 0.4,  # 12AM-5AM (very low, night)
        0.8, 1.5, 1.8, 1.6, 1.4, 1.3,    # 6AM-11AM (morning)
        1.2, 1.0, 1.1, 1.3, 1.8, 2.5,    # 12PM-5PM (afternoon)
        3.2, 3.5, 2.8, 2.0, 1.2, 0.7,    # 6PM-11PM (evening peak)
    ]

    for day_offset in range(days):
        current_date = start + timedelta(days=day_offset)
        is_weekend = current_date.weekday() >= 5
        # Small adjustment factors — don't multiply together to avoid inflation
        day_adjustment = 0.15 if is_weekend else 0.0

        # Seasonal adjustment (additive, not multiplicative)
        month = current_date.month
        if month in [4, 5, 6, 7]:   # Summer AC months
            seasonal_adjustment = 0.3
        elif month in [11, 12, 1]:   # Winter
            seasonal_adjustment = 0.1
        else:
            seasonal_adjustment = 0.0

        for hour in range(24):
            ts = current_date.replace(hour=hour)
            base = base_pattern[hour] + day_adjustment + seasonal_adjustment

            # Add realistic noise (small, proportional to base)
            noise = np.random.normal(0, base * 0.1)
            actual = max(0.1, base + noise)

            # Occasionally inject anomalies (1.5% chance)
            if np.random.random() < 0.015:
                actual *= np.random.uniform(1.5, 2.2)

            data.append({
                "timestamp": ts.isoformat(),
                "hour": hour,
                "day_of_week": ts.weekday(),
                "month": ts.month,
                "is_weekend": is_weekend,
                "actual_kwh": round(actual, 2),
            })

    return data


# Global instance
data_store = DataStore()
