"""
Peak detection utilities.
Identifies peak hours and calculates grid stress.
"""

from typing import List, Dict, Tuple
from app.core.config import PEAK_HOURS_START, PEAK_HOURS_END


def identify_peak_hours(hourly_data: List[Dict], top_n: int = 3) -> List[Dict]:
    """
    Identify the top N peak consumption hours from 24h data.
    Returns sorted list of peak hours with grid stress classification.
    """
    if not hourly_data:
        return []

    # Sort by actual usage, descending
    sorted_hours = sorted(hourly_data, key=lambda h: h.get("actual_kwh", 0), reverse=True)
    peaks = []

    for h in sorted_hours[:top_n]:
        hour = h.get("hour", 0)
        load = h.get("actual_kwh", 0)
        stress = classify_grid_stress(load)

        peaks.append({
            "hour": f"{hour:02d}:00 - {(hour + 1) % 24:02d}:00",
            "load": round(load, 1),
            "gridStress": stress,
        })

    return peaks


def classify_grid_stress(load_kwh: float) -> str:
    """Classify grid stress level based on load."""
    if load_kwh > 4.0:
        return "high"
    elif load_kwh > 2.5:
        return "moderate"
    else:
        return "low"


def calculate_grid_stress(hourly_data: List[Dict]) -> Dict:
    """
    Calculate overall grid stress metrics.
    """
    if not hourly_data:
        return {
            "currentLoad": 0,
            "maxCapacity": 100,
            "level": "low",
            "percentage": 0,
        }

    # Current hour's load (last in the data)
    current = hourly_data[-1] if hourly_data else {}
    current_load = current.get("actual_kwh", 0)

    # Max capacity estimation (based on max observed + margin)
    max_observed = max(h.get("actual_kwh", 0) for h in hourly_data)
    max_capacity = max(max_observed * 1.3, 6.0)  # 30% headroom

    percentage = round((current_load / max_capacity) * 100, 1)
    level = classify_grid_stress(current_load)

    return {
        "currentLoad": round(current_load, 1),
        "maxCapacity": round(max_capacity, 1),
        "level": level,
        "percentage": min(percentage, 100),
    }


def is_peak_hour(hour: int) -> bool:
    """Check if given hour is within peak range."""
    return PEAK_HOURS_START <= hour <= PEAK_HOURS_END


def find_optimal_hour(hourly_data: List[Dict]) -> int:
    """Find the hour with lowest load (best for shifting appliances)."""
    if not hourly_data:
        return 14  # Default off-peak

    # Only consider reasonable hours (6 AM - 4 PM)
    daytime = [h for h in hourly_data if 6 <= h.get("hour", 0) <= 16]
    if not daytime:
        daytime = hourly_data

    min_hour = min(daytime, key=lambda h: h.get("actual_kwh", float("inf")))
    return min_hour.get("hour", 14)
