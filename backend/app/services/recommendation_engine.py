"""
Recommendation Engine — generates dynamic, model-driven optimization suggestions.

Pipeline:
  RF forecast output  ─┐
                        ├──► rule engine ──► structured recommendations JSON
  IF anomaly output   ─┘

All rules are data-driven; no values are hardcoded for normal operation.
"""

from typing import List, Dict, Tuple
import numpy as np


# ── Thresholds ────────────────────────────────────────────────────────────────
PEAK_LOAD_HIGH        = 3.5   # kWh/h — upper band
PEAK_LOAD_MEDIUM      = 2.0   # kWh/h — middle band
SPIKE_MULTIPLIER      = 1.8   # predicted spike if > 1.8× rolling mean
LOW_VARIANCE_CV       = 0.15  # coefficient of variation below which usage is "stable"
ANOMALY_REPEAT_COUNT  = 2     # anomalies at same hour on ≥N records = repeat anomaly
HIGH_RISK_THRESHOLD   = 3     # ≥3 high-severity findings → risk_level = high

# ── Recommendation priority tag ───────────────────────────────────────────────
P_CRITICAL = "critical"
P_WARNING  = "warning"
P_INFO     = "info"
P_POSITIVE = "positive"


def generate_recommendations(
    forecast_records: List[Dict],    # output from forecasting_service.predict_next_24h (as hourly dicts)
    anomaly_records : List[Dict],    # output from anomaly_service.detect on historical data
    anomaly_summary : Dict,          # output from anomaly_service.get_summary
) -> Dict:
    """
    Core entry point.  Analyses forecast + anomaly outputs and returns:
    {
      risk_level        : "low" | "medium" | "high",
      risk_score        : int  (0–100),
      peak_hours        : [int, ...],
      low_hours         : [int, ...],
      anomaly_hours     : [str, ...],
      forecast_trend    : "rising" | "falling" | "stable",
      recommendations   : [{priority, icon, title, description, action}, ...]
      stats             : {avg_predicted, max_predicted, std_predicted, ...}
    }
    """
    recs: List[Dict] = []
    risk_score = 0

    # ── 1. Forecast analysis ─────────────────────────────────────────────────
    forecast_stats = _analyze_forecast(forecast_records)
    peak_hours     = forecast_stats["peak_hours"]
    low_hours      = forecast_stats["low_hours"]
    trend          = forecast_stats["trend"]
    avg_pred       = forecast_stats["avg_predicted"]
    max_pred       = forecast_stats["max_predicted"]
    std_pred       = forecast_stats["std_predicted"]
    cv             = forecast_stats["cv"]
    spike_hours    = forecast_stats["spike_hours"]

    # ── 2. Anomaly analysis ──────────────────────────────────────────────────
    anom_count   = anomaly_summary.get("anomaly_count", 0)
    anom_pct     = anomaly_summary.get("anomaly_percent", 0)
    anom_hours   = anomaly_summary.get("anomaly_hours", [])
    repeat_hours = _find_repeat_anomaly_hours(anomaly_records)

    # ── 3. Rules ─────────────────────────────────────────────────────────────

    # Rule A — very high predicted peak
    if max_pred >= PEAK_LOAD_HIGH:
        peak_labels = ", ".join(f"{h:02d}:00" for h in peak_hours[:3])
        recs.append({
            "priority"   : P_CRITICAL,
            "icon"       : "⚡",
            "title"      : f"High load forecast: {max_pred:.1f} kWh",
            "description": f"Peak demand expected at {peak_labels}. Grid stress will be HIGH.",
            "action"     : f"Pre-cool AC and defer heavy loads before {peak_hours[0]:02d}:00.",
        })
        risk_score += 30

    elif max_pred >= PEAK_LOAD_MEDIUM:
        peak_labels = ", ".join(f"{h:02d}:00" for h in peak_hours[:2])
        recs.append({
            "priority"   : P_WARNING,
            "icon"       : "🔶",
            "title"      : f"Moderate peak forecast at {peak_labels}",
            "description": f"Predicted usage reaches {max_pred:.1f} kWh — above the moderate threshold.",
            "action"     : "Consider shifting dishwasher and water heater to low-load hours.",
        })
        risk_score += 15

    # Rule B — predicted spike (sudden jump)
    if spike_hours:
        spike_labels = ", ".join(f"{h:02d}:00" for h in spike_hours[:2])
        recs.append({
            "priority"   : P_WARNING,
            "icon"       : "📈",
            "title"      : f"Predicted usage spike at {spike_labels}",
            "description": f"Forecast shows a sudden jump >{SPIKE_MULTIPLIER}× the rolling average.",
            "action"     : "Stagger high-power appliance start times to spread the spike.",
        })
        risk_score += 20

    # Rule C — optimal load-shift window
    if low_hours:
        low_labels = ", ".join(f"{h:02d}:00" for h in low_hours[:3])
        recs.append({
            "priority"   : P_INFO,
            "icon"       : "🕐",
            "title"      : "Best time to run heavy appliances",
            "description": f"Lowest predicted load: {low_labels} — cheapest tariff window.",
            "action"     : "Schedule washing machine, EV charging, and water heater here.",
        })

    # Rule D — rising trend
    if trend == "rising":
        recs.append({
            "priority"   : P_WARNING,
            "icon"       : "📊",
            "title"      : "Usage trending upward tomorrow",
            "description": "Forecast shows a consistently rising consumption curve across the day.",
            "action"     : "Review always-on devices (routers, set-top boxes) and reduce standby loads.",
        })
        risk_score += 10

    elif trend == "stable" and cv <= LOW_VARIANCE_CV:
        recs.append({
            "priority"   : P_POSITIVE,
            "icon"       : "✅",
            "title"      : "Usage pattern is stable and efficient",
            "description": f"Predicted usage has low variance (CoV={cv:.2f}). Current schedule is well-balanced.",
            "action"     : "Maintain current habits. Consider solar scheduling during low-load hours.",
        })

    # Rule E — anomalies detected
    if anom_count > 0:
        recs.append({
            "priority"   : P_WARNING if anom_pct < 20 else P_CRITICAL,
            "icon"       : "⚠️",
            "title"      : f"{anom_count} anomalous readings detected ({anom_pct:.0f}% of data)",
            "description": f"Isolation Forest flagged abnormal consumption at: {', '.join(anom_hours[:5])}{'...' if len(anom_hours) > 5 else ''}.",
            "action"     : "Inspect high-draw appliances at those hours. Check for meter issues.",
        })
        risk_score += min(int(anom_pct), 30)

    # Rule F — repeat anomalies at same hour (device fault pattern)
    if repeat_hours:
        r_labels = ", ".join(f"{h:02d}:00" for h in repeat_hours[:3])
        recs.append({
            "priority"   : P_CRITICAL,
            "icon"       : "🔧",
            "title"      : f"Recurring anomaly pattern at {r_labels}",
            "description": "The same hours show abnormal consumption repeatedly — likely a faulty or misconfigured device.",
            "action"     : "Inspect devices that operate consistently at those hours (AC, water heater, industrial motor).",
        })
        risk_score += 25

    # Rule G — no anomalies, clean data
    if anom_count == 0 and max_pred < PEAK_LOAD_MEDIUM:
        recs.append({
            "priority"   : P_POSITIVE,
            "icon"       : "🌱",
            "title"      : "Clean data, no anomalies found",
            "description": "Your energy profile is healthy — no unusual consumption spikes in the last 24h.",
            "action"     : "Keep appliances on a timer schedule to lock in these savings.",
        })

    # ── 4. Risk level ─────────────────────────────────────────────────────────
    risk_score = min(risk_score, 100)
    if risk_score >= 50:
        risk_level = "high"
    elif risk_score >= 20:
        risk_level = "medium"
    else:
        risk_level = "low"

    return {
        "risk_level"     : risk_level,
        "risk_score"     : risk_score,
        "peak_hours"     : peak_hours,
        "low_hours"      : low_hours,
        "anomaly_hours"  : anom_hours,
        "forecast_trend" : trend,
        "recommendations": recs,
        "stats": {
            "avg_predicted": round(avg_pred, 2),
            "max_predicted": round(max_pred, 2),
            "std_predicted": round(std_pred, 2),
            "anomaly_count": anom_count,
            "anomaly_pct"  : anom_pct,
        },
    }


# ── Internal helpers ──────────────────────────────────────────────────────────

def _analyze_forecast(records: List[Dict]) -> Dict:
    """Derive statistics and patterns from the 24-hour forecast records."""
    if not records:
        return {
            "peak_hours": [], "low_hours": [], "spike_hours": [],
            "trend": "stable", "avg_predicted": 0,
            "max_predicted": 0, "std_predicted": 0, "cv": 0,
        }

    values = [float(r.get("actual_kwh", r.get("predicted", 0))) for r in records]
    hours  = [r.get("hour", i) for i, r in enumerate(records)]

    arr     = np.array(values)
    avg_v   = float(np.mean(arr))
    max_v   = float(np.max(arr))
    std_v   = float(np.std(arr))
    cv      = std_v / max(avg_v, 0.01)

    # Peak hours: top-3 by value
    sorted_idx = np.argsort(arr)[::-1]
    peak_hours = list({hours[i] for i in sorted_idx[:5]})[:3]

    # Low hours: bottom 3 daytime hours (6-22h range preferred)
    daytime_idx = [i for i, h in enumerate(hours) if 6 <= h <= 22]
    if daytime_idx:
        dt_arr  = [(i, arr[i]) for i in daytime_idx]
        dt_arr  = sorted(dt_arr, key=lambda x: x[1])
        low_hours = list({hours[i] for i, _ in dt_arr[:5]})[:3]
    else:
        low_hours = list({hours[i] for i in np.argsort(arr)[:5]})[:3]

    # Spike detection: any hour > SPIKE_MULTIPLIER × rolling 3h mean
    spike_hours = []
    for i in range(len(values)):
        window_mean = float(np.mean(arr[max(0, i - 2): i + 1]))
        if values[i] > SPIKE_MULTIPLIER * window_mean and values[i] > PEAK_LOAD_MEDIUM:
            spike_hours.append(hours[i])

    # Trend: linear regression slope
    if len(values) >= 4:
        x    = np.arange(len(values), dtype=float)
        slope = float(np.polyfit(x, arr, 1)[0])
        if slope > 0.05:
            trend = "rising"
        elif slope < -0.05:
            trend = "falling"
        else:
            trend = "stable"
    else:
        trend = "stable"

    return {
        "peak_hours"   : peak_hours,
        "low_hours"    : low_hours,
        "spike_hours"  : list(dict.fromkeys(spike_hours)),  # preserve order, dedupe
        "trend"        : trend,
        "avg_predicted": avg_v,
        "max_predicted": max_v,
        "std_predicted": std_v,
        "cv"           : cv,
    }


def _find_repeat_anomaly_hours(anomaly_records: List[Dict]) -> List[int]:
    """
    Find hours that appear as anomalies in multiple records
    (indicates a recurring fault pattern, not a one-off spike).
    """
    from collections import Counter
    hour_counts = Counter(
        r.get("hour", -1)
        for r in anomaly_records
        if r.get("is_anomaly") and r.get("hour", -1) >= 0
    )
    return [h for h, count in hour_counts.items() if count >= ANOMALY_REPEAT_COUNT]
