"""
Insight Summary Service — generates compressed metrics for the Gemini AI prompt.
This is the critical compression layer that prevents raw data from going to the API.
"""

from typing import Dict, List
from app.utils.peak_detection import identify_peak_hours, find_optimal_hour
from app.services.tariff_service import calculate_cost


def generate_insight_summary(latest_24h: List[Dict], all_data: List[Dict]) -> Dict:
    """
    Generate a compressed insight payload for Gemini.
    Never sends raw CSV data — only derived metrics.
    """
    if not latest_24h:
        return _default_summary()

    # Monthly total units (use all history up to last 720 records ≈ 30 days)
    monthly_units = round(sum(h.get("actual_kwh", 0) for h in all_data[-720:]), 1)

    # Projected cost
    cost_data = calculate_cost(all_data, latest_24h)
    projected_cost = cost_data.get("monthlyCost", 0)
    daily_cost = cost_data.get("dailyCost", 0)

    # Peak hours — `identify_peak_hours` returns {"hour": "13:00 - 14:00", ...}
    # Extract just the START hour as an int from the range-string
    peaks = identify_peak_hours(latest_24h, top_n=3)
    peak_hours = []
    seen = set()
    for p in peaks:
        hour_str = p.get("hour", "0:00")
        try:
            # "13:00 - 14:00" → 13
            h = int(hour_str.split(":")[0])
        except (ValueError, IndexError):
            h = 0
        if h not in seen:          # deduplicate
            seen.add(h)
            peak_hours.append(h)

    # Average daily usage from latest 24h
    daily_usage = round(sum(h.get("actual_kwh", 0) for h in latest_24h), 2)

    # Peak concentration: % of daily load that falls in the TOP-3 peak hours
    # Use the actual flagged peak hours, not a fixed 17-22 window
    peak_usage = sum(h.get("actual_kwh", 0) for h in latest_24h if h.get("hour", 0) in peak_hours)
    peak_pct = round((peak_usage / max(daily_usage, 0.01)) * 100, 1)

    # Lowest load hours (best candidates for appliance shifting)
    sorted_by_load = sorted(latest_24h, key=lambda h: h.get("actual_kwh", float("inf")))
    lowest_hours = list({h.get("hour", 0) for h in sorted_by_load[:5]})[:3]

    # Recommended shift — lowest-load daytime hour
    optimal_hour = find_optimal_hour(latest_24h)

    # Tariff savings potential: shifting from peak rate to off-peak rate
    # Peak rate slab ≈ 7.6 ₹/kWh (above 400 units), off-peak ≈ 4.7 ₹/kWh
    # Realistic savings from shifting top-3 peak hours at 1 cycle/day
    peak_kwh_per_day = peak_usage  # kWh in peak hours
    savings_per_day = peak_kwh_per_day * (7.6 - 4.7)   # ≈ tariff difference
    monthly_savings_est = round(savings_per_day * 30, 0)
    savings_pct = round((monthly_savings_est / max(projected_cost, 1)) * 100, 1)
    savings_pct = max(5.0, min(savings_pct, 30.0))   # clamp 5-30% for realism

    return {
        "monthly_units"           : monthly_units,
        "projected_cost"          : round(projected_cost, 0),
        "daily_cost"              : round(daily_cost, 0),
        "peak_hours"              : peak_hours,
        "lowest_hours"            : lowest_hours,
        "average_daily_usage"     : daily_usage,
        "peak_concentration_pct"  : peak_pct,
        "recommended_shift_hour"  : optimal_hour,
        "estimated_savings_percent": savings_pct,
        "monthly_savings_est"     : monthly_savings_est,
    }


def format_summary_for_prompt(summary: Dict) -> str:
    """Format the insight summary as clear, precise text for the AI prompt."""
    optimal_h = summary.get("recommended_shift_hour", 14)
    suffix    = "AM" if optimal_h < 12 else "PM"
    display_h = f"{optimal_h % 12 or 12}:00 {suffix}"

    peak_hours   = summary.get("peak_hours", [])
    peak_labels  = [f"{h:02d}:00" for h in peak_hours]
    lowest_hours = summary.get("lowest_hours", [])
    low_labels   = [f"{h:02d}:00" for h in lowest_hours]

    savings_pct = summary.get("estimated_savings_percent", 0)
    savings_amt = summary.get("monthly_savings_est", round(summary.get("projected_cost", 0) * savings_pct / 100))

    return f"""• Monthly energy consumed : {summary.get('monthly_units', 'N/A')} kWh
• Projected monthly cost   : ₹{summary.get('projected_cost', 'N/A'):,}
• Estimated daily cost     : ₹{summary.get('daily_cost', 'N/A')}
• Average daily usage      : {summary.get('average_daily_usage', 'N/A')} kWh
• Peak hours (highest load): {', '.join(peak_labels) if peak_labels else 'N/A'}
• Peak concentration       : {summary.get('peak_concentration_pct', 'N/A')}% of daily load
• Lowest-load hours        : {', '.join(low_labels) if low_labels else 'N/A'}
• Best time to shift loads : {display_h}
• Potential monthly savings: ₹{savings_amt:,.0f} ({savings_pct}% reduction)"""


def _default_summary() -> Dict:
    return {
        "monthly_units"           : 820,
        "projected_cost"          : 7200,
        "daily_cost"              : 240,
        "peak_hours"              : [18, 19, 20],
        "lowest_hours"            : [2, 3, 4],
        "average_daily_usage"     : 27.3,
        "peak_concentration_pct"  : 35,
        "recommended_shift_hour"  : 14,
        "estimated_savings_percent": 17.5,
        "monthly_savings_est"     : 1260,
    }
