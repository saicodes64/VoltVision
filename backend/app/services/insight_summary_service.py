"""
Insight Summary Service — generates compressed metrics for the Gemini AI prompt.
This is the critical compression layer that prevents raw data from going to the API.
"""

from typing import Dict
from app.state.data_store import data_store
from app.utils.peak_detection import identify_peak_hours, find_optimal_hour
from app.services.tariff_service import calculate_cost


def generate_insight_summary() -> Dict:
    """
    Generate a compressed insight payload for Gemini.
    This is what gets sent to the AI — never raw CSV data.
    """
    latest_24h = data_store.get_latest_24h()
    all_data = data_store.get_all_data()

    if not latest_24h:
        return _default_summary()

    # Monthly total units
    monthly_data = data_store.get_monthly_data()
    monthly_units = round(sum(h.get("actual_kwh", 0) for h in monthly_data), 1)

    # Projected cost
    cost_data = calculate_cost()
    projected_cost = cost_data.get("monthlyCost", 0)

    # Peak hours
    peaks = identify_peak_hours(latest_24h, top_n=3)
    peak_hours = [int(p["hour"].split(":")[0]) for p in peaks]

    # Lowest load hours
    sorted_by_usage = sorted(latest_24h, key=lambda h: h.get("actual_kwh", 0))
    lowest_hours = [h.get("hour", 0) for h in sorted_by_usage[:3]]

    # Average daily usage
    daily_usage = round(sum(h.get("actual_kwh", 0) for h in latest_24h), 2)

    # % load in peak hours (5PM - 10PM)
    peak_usage = sum(h.get("actual_kwh", 0) for h in latest_24h if 17 <= h.get("hour", 0) <= 22)
    peak_pct = round((peak_usage / max(daily_usage, 0.01)) * 100, 1)

    # Recommended shift
    optimal_hour = find_optimal_hour(latest_24h)

    # Estimated savings
    savings_pct = round(peak_pct * 0.35, 1)  # ~35% of peak concentration can be saved

    return {
        "monthly_units": monthly_units,
        "projected_cost": round(projected_cost, 0),
        "peak_hours": peak_hours,
        "lowest_hours": lowest_hours,
        "average_daily_usage": daily_usage,
        "peak_concentration_pct": peak_pct,
        "recommended_shift_hour": optimal_hour,
        "estimated_savings_percent": min(savings_pct, 25),  # Cap at 25%
    }


def format_summary_for_prompt(summary: Dict) -> str:
    """Format the insight summary as a human-readable string for the AI prompt."""
    optimal_h = summary.get("recommended_shift_hour", 14)
    suffix = "AM" if optimal_h < 12 else "PM"
    display_h = optimal_h % 12 or 12

    peak_labels = [f"{h}:00" for h in summary.get("peak_hours", [])]

    return f"""• Monthly units consumed: {summary.get('monthly_units', 'N/A')} kWh
• Projected monthly cost: ₹{summary.get('projected_cost', 'N/A')}
• Peak hours: {', '.join(peak_labels) if peak_labels else 'N/A'}
• Average daily usage: {summary.get('average_daily_usage', 'N/A')} kWh
• Peak concentration: {summary.get('peak_concentration_pct', 'N/A')}% of daily load
• Recommended shift time: {display_h}:00 {suffix}
• Estimated savings: {summary.get('estimated_savings_percent', 'N/A')}%"""


def _default_summary() -> Dict:
    return {
        "monthly_units": 820,
        "projected_cost": 7200,
        "peak_hours": [18, 19, 20],
        "lowest_hours": [2, 3, 4],
        "average_daily_usage": 27.3,
        "peak_concentration_pct": 35,
        "recommended_shift_hour": 14,
        "estimated_savings_percent": 17.5,
    }
