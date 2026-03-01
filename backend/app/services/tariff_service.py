"""
Tariff service — slab-based Indian electricity cost calculation.

Slabs (as per prompt specification):
  0–100 units     → ₹4.28
  101–300 units   → ₹11.10
  301–500 units   → ₹15.33
  501–1000 units  → ₹17.68
  >1000 units     → ₹17.68
"""

from typing import Dict, List, Optional, Tuple

# Hardcoded tariff slabs — do NOT use LLM/AI for these calculations
TARIFF_SLABS = [
    {"min": 0,    "max": 100,          "rate": 4.28,  "label": "0-100"},
    {"min": 101,  "max": 300,          "rate": 11.10, "label": "101-300"},
    {"min": 301,  "max": 500,          "rate": 15.33, "label": "301-500"},
    {"min": 501,  "max": 1000,         "rate": 17.68, "label": "501-1000"},
    {"min": 1001, "max": float("inf"), "rate": 17.68, "label": ">1000"},
]

FIXED_CHARGE_PER_MONTH = 50.0


# ─────────────────────────────────────────────────────────────
# Core slab helpers
# ─────────────────────────────────────────────────────────────

def get_slab_rate(monthly_units: float) -> float:
    """Return the marginal rate (₹/unit) for the slab that covers monthly_units."""
    for slab in TARIFF_SLABS:
        if monthly_units <= slab["max"]:
            return slab["rate"]
    return TARIFF_SLABS[-1]["rate"]


def get_slab_name(monthly_units: float) -> str:
    """Return the human-readable slab name (e.g. '101-300') for the current usage."""
    for slab in TARIFF_SLABS:
        if monthly_units <= slab["max"]:
            return slab["label"]
    return TARIFF_SLABS[-1]["label"]


def calculate_marginal_cost(monthly_units: float) -> float:
    """
    Return the effective marginal cost (₹/unit) at the current usage level.
    This is the rate applied to the *next* unit consumed.
    """
    return get_slab_rate(monthly_units)


def calculate_slab_risk(monthly_units: float) -> Dict:
    """
    Determine slab risk and units remaining to the next slab boundary.

    Returns:
        {
          "risk": "Low" | "Medium" | "High",
          "units_to_next_slab": <int or None if already in last slab>
        }
    """
    for i, slab in enumerate(TARIFF_SLABS[:-1]):  # skip last (infinite) slab
        if monthly_units <= slab["max"]:
            units_remaining = slab["max"] - monthly_units
            if units_remaining <= 20:
                risk = "High"
            elif units_remaining <= 50:
                risk = "Medium"
            else:
                risk = "Low"
            return {"risk": risk, "units_to_next_slab": int(units_remaining)}

    # Already in the last slab
    return {"risk": "Low", "units_to_next_slab": None}


# ─────────────────────────────────────────────────────────────
# Full cost calculation (used by /calculate-cost and /forecast)
# ─────────────────────────────────────────────────────────────

def _calculate_slab_cost(monthly_units: float) -> Tuple[float, List[Dict]]:
    """Calculate total cost using slab-based tariff and return breakdown."""
    remaining = monthly_units
    total_cost = 0.0
    breakdown = []

    for slab in TARIFF_SLABS:
        if remaining <= 0:
            break

        slab_size = slab["max"] - slab["min"] + 1
        if slab["max"] == float("inf"):
            slab_size = remaining

        units_in_slab = min(remaining, slab_size)
        cost = units_in_slab * slab["rate"]
        total_cost += cost

        breakdown.append({
            "slab": f"{slab['label']} units",
            "units": round(units_in_slab, 1),
            "rate": slab["rate"],
            "cost": round(cost, 2),
        })

        remaining -= units_in_slab

    return total_cost, breakdown


def _calculate_trend(all_data: List[Dict], current_daily_kwh: float) -> Tuple[str, float]:
    """Calculate usage trend compared to previous 24h."""
    if len(all_data) < 48:
        return "up", 0.0

    prev_24h = all_data[-48:-24]
    prev_daily = sum(h.get("actual_kwh", 0) for h in prev_24h)

    if prev_daily == 0:
        return "up", 0.0

    change_pct = ((current_daily_kwh - prev_daily) / prev_daily) * 100
    return ("up" if change_pct >= 0 else "down"), abs(change_pct)


def calculate_cost(all_data: List[Dict], latest_24h: List[Dict]) -> Dict:
    """
    Calculate cost projection based on current usage data.
    Now uses the correct 5-slab tariff.
    """
    if not latest_24h:
        return _default_cost()

    daily_kwh = sum(h.get("actual_kwh", 0) for h in latest_24h)
    monthly_kwh = daily_kwh * 30

    monthly_cost, slab_breakdown = _calculate_slab_cost(monthly_kwh)
    monthly_cost += FIXED_CHARGE_PER_MONTH

    daily_cost = round(monthly_cost / 30, 2)
    trend, trend_percent = _calculate_trend(all_data, daily_kwh)

    slab_risk_data = calculate_slab_risk(monthly_kwh)

    return {
        "dailyCost": daily_cost,
        "monthlyCost": round(monthly_cost, 2),
        "trend": trend,
        "trendPercent": round(trend_percent, 1),
        "slabRisk": slab_risk_data["risk"] in ("Medium", "High"),
        "slabRiskLevel": slab_risk_data["risk"],
        "slabBreakdown": slab_breakdown,
        "currentSlab": get_slab_name(monthly_kwh),
        "marginalRate": get_slab_rate(monthly_kwh),
        "currentMonthUnits": round(monthly_kwh, 1),
        "unitsToNextSlab": slab_risk_data["units_to_next_slab"],
    }


def _default_cost() -> Dict:
    return {
        "dailyCost": 0,
        "monthlyCost": 0,
        "trend": "up",
        "trendPercent": 0,
        "slabRisk": False,
        "slabRiskLevel": "Low",
        "slabBreakdown": [],
        "currentSlab": "0-100",
        "marginalRate": 4.28,
        "currentMonthUnits": 0,
        "unitsToNextSlab": 100,
    }
