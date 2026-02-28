"""
Optimization service — appliance scheduling, savings calculations.
"""

from typing import Dict, List
from app.utils.peak_detection import find_optimal_hour, identify_peak_hours, is_peak_hour
from app.core.config import CO2_PER_KWH, TARIFF_SLABS
from app.services.tariff_service import calculate_cost


def optimize_appliance(latest_24h: List[Dict], name: str, appliance_type: str, power_kwh: float, duration_hrs: float, preferred_time: str = None) -> Dict:
    """
    Generate optimization recommendation for an appliance.
    
    Args:
        name: Appliance name
        appliance_type: 'home' or 'industrial'
        power_kwh: Power consumption in kWh
        duration_hrs: Usage duration in hours
        preferred_time: Optional preferred time
    
    Returns: recommendation + savings data
    """

    # Find peak and optimal hours
    peaks = identify_peak_hours(latest_24h, top_n=3)
    optimal_hour = find_optimal_hour(latest_24h)

    # Determine current time (assume user runs during peak)
    if preferred_time:
        current_hour = _parse_time_to_hour(preferred_time)
    else:
        # Default: assume worst case — running during highest peak
        current_hour = 19  # 7 PM default peak

    # Energy consumption per cycle
    energy_per_cycle = power_kwh * duration_hrs

    # Cost at current (peak) time
    peak_rate = _get_rate_for_hour(current_hour, latest_24h)
    optimal_rate = _get_rate_for_hour(optimal_hour, latest_24h)

    cost_at_peak = energy_per_cycle * peak_rate
    cost_at_optimal = energy_per_cycle * optimal_rate

    savings_per_cycle = max(0, cost_at_peak - cost_at_optimal)
    savings_percent = round((savings_per_cycle / max(cost_at_peak, 0.01)) * 100, 1)

    # CO2 reduction from shifting
    co2_reduction = round(energy_per_cycle * CO2_PER_KWH * (savings_percent / 100), 1)

    # Monthly projections (assume 1 cycle per day)
    cycles_per_month = 30
    monthly_before = round(cost_at_peak * cycles_per_month, 2)
    monthly_after = round(cost_at_optimal * cycles_per_month, 2)
    monthly_savings = round(savings_per_cycle * cycles_per_month, 2)
    annual_savings = round(monthly_savings * 12, 2)
    monthly_carbon = round(co2_reduction * cycles_per_month, 1)
    trees_saved = round(monthly_carbon / 21.0, 1)  # ~21 kg CO2 per tree/year / 12 months

    recommendation = {
        "appliance": name,
        "currentTime": _hour_to_label(current_hour, is_peak_hour(current_hour)),
        "recommendedTime": _hour_to_label(optimal_hour, False),
        "savingsPercent": savings_percent,
        "savingsAmount": round(savings_per_cycle, 2),
        "co2Reduction": co2_reduction,
    }

    savings = {
        "beforeCost": monthly_before,
        "afterCost": monthly_after,
        "monthlySavings": monthly_savings,
        "annualSavings": annual_savings,
        "carbonReduction": monthly_carbon,
        "treesSaved": trees_saved,
    }

    return {
        "recommendation": recommendation,
        "savings": savings,
    }


def get_default_savings(latest_24h: List[Dict], all_data: List[Dict]) -> Dict:
    """Get savings data based on general optimization of all peak usage."""
    if not latest_24h:
        return _default_savings()

    cost_data = calculate_cost(all_data, latest_24h)
    monthly_cost = cost_data.get("monthlyCost", 5000)

    # Estimate 15-20% savings from optimization
    savings_pct = 0.18
    monthly_savings = round(monthly_cost * savings_pct, 2)

    return {
        "beforeCost": monthly_cost,
        "afterCost": round(monthly_cost - monthly_savings, 2),
        "monthlySavings": monthly_savings,
        "annualSavings": round(monthly_savings * 12, 2),
        "carbonReduction": round(monthly_savings / 7 * CO2_PER_KWH, 1),
        "treesSaved": round(monthly_savings / 7 * CO2_PER_KWH / 21, 1),
    }


def _get_rate_for_hour(hour: int, hourly_data: list) -> float:
    """Get effective rate for a given hour based on usage intensity."""
    # Peak hours get higher effective rate
    if is_peak_hour(hour):
        return TARIFF_SLABS[4]["rate"] if len(TARIFF_SLABS) > 4 else 7.5
    else:
        return TARIFF_SLABS[1]["rate"] if len(TARIFF_SLABS) > 1 else 4.5


def _parse_time_to_hour(time_str: str) -> int:
    """Parse time string to hour (0-23)."""
    try:
        time_str = time_str.strip().lower()
        for fmt_suffix in ["pm", "am"]:
            if fmt_suffix in time_str:
                h = int(time_str.replace(fmt_suffix, "").strip().split(":")[0])
                if fmt_suffix == "pm" and h != 12:
                    h += 12
                elif fmt_suffix == "am" and h == 12:
                    h = 0
                return h
        return int(time_str.split(":")[0])
    except (ValueError, IndexError):
        return 19  # Default peak hour


def _hour_to_label(hour: int, is_peak: bool) -> str:
    """Convert hour to human-readable label."""
    suffix = "AM" if hour < 12 else "PM"
    display_hour = hour % 12 or 12
    label = f"{display_hour}:00 {suffix}"
    if is_peak:
        label += " (Peak)"
    else:
        label += " (Off-Peak)"
    return label


def _default_savings() -> Dict:
    return {
        "beforeCost": 5580,
        "afterCost": 4464,
        "monthlySavings": 1116,
        "annualSavings": 13392,
        "carbonReduction": 24,
        "treesSaved": 3,
    }
