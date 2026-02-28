"""
Tariff service — slab-based Indian electricity cost calculation.
"""

from typing import Dict, List
from app.core.config import TARIFF_SLABS, FIXED_CHARGE_PER_MONTH, DEMAND_CHARGE_PER_KW
from app.state.data_store import data_store


def calculate_cost() -> Dict:
    """
    Calculate cost projection based on current usage data.
    Uses Indian slab-based tariff system.
    """
    all_data = data_store.get_all_data()
    latest_24h = data_store.get_latest_24h()

    if not latest_24h:
        return _default_cost()

    # Daily usage
    daily_kwh = sum(h.get("actual_kwh", 0) for h in latest_24h)

    # Monthly projection (from daily)
    monthly_kwh = daily_kwh * 30

    # Slab-based calculation
    monthly_cost, slab_breakdown = _calculate_slab_cost(monthly_kwh)
    monthly_cost += FIXED_CHARGE_PER_MONTH

    # Daily cost
    daily_cost = round(monthly_cost / 30, 2)

    # Trend calculation — compare current day vs previous data
    trend, trend_percent = _calculate_trend(all_data, daily_kwh)

    # Slab risk — are we close to jumping to the next slab?
    slab_risk = _check_slab_risk(monthly_kwh)

    return {
        "dailyCost": daily_cost,
        "monthlyCost": round(monthly_cost, 2),
        "trend": trend,
        "trendPercent": round(trend_percent, 1),
        "slabRisk": slab_risk,
        "slabBreakdown": slab_breakdown,
    }


def _calculate_slab_cost(monthly_units: float) -> tuple:
    """Calculate cost using slab-based tariff and return breakdown."""
    remaining = monthly_units
    total_cost = 0
    breakdown = []

    for slab in TARIFF_SLABS:
        slab_min = slab["min"]
        slab_max = slab["max"]
        rate = slab["rate"]

        if remaining <= 0:
            break

        slab_range = min(slab_max, slab_min + 100) - slab_min
        if slab_max == float("inf"):
            slab_range = remaining

        units_in_slab = min(remaining, slab_range)
        cost = units_in_slab * rate
        total_cost += cost

        breakdown.append({
            "slab": f"{slab_min}-{int(slab_max) if slab_max != float('inf') else '∞'} units",
            "units": round(units_in_slab, 1),
            "rate": rate,
            "cost": round(cost, 2),
        })

        remaining -= units_in_slab

    return total_cost, breakdown


def _calculate_trend(all_data: List[Dict], current_daily_kwh: float) -> tuple:
    """Calculate usage trend compared to previous period."""
    if len(all_data) < 48:
        return "up", 0

    # Previous 24h
    prev_24h = all_data[-48:-24]
    prev_daily = sum(h.get("actual_kwh", 0) for h in prev_24h)

    if prev_daily == 0:
        return "up", 0

    change_pct = ((current_daily_kwh - prev_daily) / prev_daily) * 100
    trend = "up" if change_pct >= 0 else "down"

    return trend, abs(change_pct)


def _check_slab_risk(monthly_units: float) -> bool:
    """Check if user is close to jumping to a higher tariff slab."""
    for i, slab in enumerate(TARIFF_SLABS[:-1]):
        if monthly_units <= slab["max"]:
            headroom = slab["max"] - monthly_units
            if headroom < 30:  # Within 30 units of next slab
                return True
            return False
    return False


def _default_cost() -> Dict:
    return {
        "dailyCost": 0,
        "monthlyCost": 0,
        "trend": "up",
        "trendPercent": 0,
        "slabRisk": False,
        "slabBreakdown": [],
    }
