"""
Analytics service — computes usage analytics from stored data.
"""

from typing import List, Dict
from app.services.forecasting_service import forecasting_service
from app.utils.peak_detection import identify_peak_hours, calculate_grid_stress, classify_grid_stress
from app.core.config import TARIFF_SLABS


def get_usage_analytics(latest_24h: List[Dict], all_data: List[Dict]) -> Dict:
    """
    Compute full usage analytics for the dashboard.
    Returns hourly data (actual + predicted), peak hours, grid stress, totals.
    """

    if not latest_24h:
        return _empty_analytics()

    # Get predictions
    predictions = forecasting_service.predict_next_24h(all_data)

    # Build hourly data - match frontend's expected format
    hourly_data = []
    for i, h in enumerate(latest_24h):
        hour = h.get("hour", i)
        actual = h.get("actual_kwh", 0)
        predicted = predictions[i] if i < len(predictions) else actual
        cost_per_kwh = _get_rate_for_usage(actual)

        hourly_data.append({
            "hour": hour,
            "label": f"{hour:02d}:00",
            "actual": round(actual, 2),
            "predicted": round(predicted, 2),
            "cost": round(actual * cost_per_kwh, 2),
            "gridLoad": classify_grid_stress(actual),
        })

    # Peak hours
    peak_hours = identify_peak_hours(latest_24h, top_n=3)

    # Grid stress
    grid_stress = calculate_grid_stress(latest_24h)

    # Totals
    total_daily = round(sum(h.get("actual_kwh", 0) for h in latest_24h), 2)
    avg_hourly = round(total_daily / max(len(latest_24h), 1), 2)

    return {
        "hourlyData": hourly_data,
        "peakHours": peak_hours,
        "gridStress": grid_stress,
        "totalDailyUsage": total_daily,
        "averageHourlyUsage": avg_hourly,
    }


def _get_rate_for_usage(kwh: float) -> float:
    """Get the applicable tariff rate (simplified hourly)."""
    # For hourly display, use a mid-slab rate
    monthly_estimate = kwh * 24 * 30
    for slab in TARIFF_SLABS:
        if monthly_estimate <= slab["max"]:
            return slab["rate"]
    return TARIFF_SLABS[-1]["rate"]


def _empty_analytics() -> Dict:
    return {
        "hourlyData": [],
        "peakHours": [],
        "gridStress": {"currentLoad": 0, "maxCapacity": 100, "level": "low", "percentage": 0},
        "totalDailyUsage": 0,
        "averageHourlyUsage": 0,
    }
