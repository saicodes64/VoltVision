"""
API Routes — all 6 endpoints for VoltVision.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.schemas import (
    UploadResponse, UsageAnalyticsResponse, ForecastResponse,
    CostResponse, OptimizeRequest, OptimizeResponse, ChatRequest, ChatResponse,
    DashboardSummary,
)
from app.state.data_store import data_store
from app.utils.data_cleaning import clean_csv_data
from app.services.analytics_service import get_usage_analytics
from app.services.forecasting_service import forecasting_service
from app.services.tariff_service import calculate_cost
from app.services.optimization_service import optimize_appliance, get_default_savings
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api")


# ──────────────────────────────────────────
# 1. POST /api/upload-data
# ──────────────────────────────────────────
@router.post("/upload-data", response_model=UploadResponse)
async def upload_data(file: UploadFile = File(...)):
    """Upload CSV energy data for analysis."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    try:
        content = await file.read()
        csv_text = content.decode("utf-8")
        cleaned_data, date_range = clean_csv_data(csv_text)
        data_store.set_data(cleaned_data)

        return UploadResponse(
            message=f"Successfully processed {len(cleaned_data)} records",
            rows_processed=len(cleaned_data),
            date_range=date_range,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


# ──────────────────────────────────────────
# 2. GET /api/usage-analytics
# ──────────────────────────────────────────
@router.get("/usage-analytics")
async def usage_analytics():
    """Get 24-hour usage analytics with actual, predicted, and cost data."""
    analytics = get_usage_analytics()
    return analytics


# ──────────────────────────────────────────
# 3. POST /api/forecast
# ──────────────────────────────────────────
@router.post("/forecast")
async def forecast():
    """Get next 24-hour energy usage forecast from the RF model."""
    all_data = data_store.get_all_data()
    predictions = forecasting_service.predict_next_24h(all_data)

    from datetime import datetime, timedelta
    now = datetime.now().replace(minute=0, second=0, microsecond=0)

    hourly_data = []
    for i, pred in enumerate(predictions):
        target_time = now + timedelta(hours=i + 1)
        hour = target_time.hour

        # Get actual if available (for comparison)
        latest = data_store.get_latest_24h()
        actual = pred  # Default to predicted if no actual
        if latest and i < len(latest):
            actual = latest[i].get("actual_kwh", pred)

        cost_per_kwh = 6.5  # Average rate
        from app.utils.peak_detection import classify_grid_stress
        grid_load = classify_grid_stress(pred)

        hourly_data.append({
            "hour": hour,
            "label": f"{hour:02d}:00",
            "actual": round(actual, 2),
            "predicted": round(pred, 2),
            "cost": round(pred * cost_per_kwh, 2),
            "gridLoad": grid_load,
        })

    return {
        "hourlyData": hourly_data,
        "totalPredicted": round(sum(predictions), 2),
    }


# ──────────────────────────────────────────
# 4. POST /api/calculate-cost
# ──────────────────────────────────────────
@router.post("/calculate-cost")
async def calc_cost():
    """Calculate cost projection using slab-based tariff."""
    cost = calculate_cost()
    return cost


# ──────────────────────────────────────────
# 5. POST /api/optimize
# ──────────────────────────────────────────
@router.post("/optimize")
async def optimize(request: OptimizeRequest):
    """Get appliance scheduling optimization recommendation."""
    result = optimize_appliance(
        name=request.name,
        appliance_type=request.type,
        power_kwh=request.power,
        duration_hrs=request.duration,
        preferred_time=request.preferredTime,
    )
    return result


# ──────────────────────────────────────────
# 6. POST /api/chat
# ──────────────────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """AI chatbot endpoint — uses Gemini with compressed insight summary."""
    result = await ai_service.chat(request.user_message)
    return ChatResponse(**result)


# ──────────────────────────────────────────
# BONUS: GET /api/dashboard-summary
# ──────────────────────────────────────────
@router.get("/dashboard-summary")
async def dashboard_summary():
    """Get summary stats for the top stat cards."""
    analytics = get_usage_analytics()
    cost = calculate_cost()
    savings = get_default_savings()

    # Peak load
    peak_load = 0
    if analytics.get("peakHours"):
        peak_load = max(p.get("load", 0) for p in analytics["peakHours"])

    return {
        "totalDailyUsage": analytics.get("totalDailyUsage", 0),
        "monthlyCost": cost.get("monthlyCost", 0),
        "peakLoad": peak_load,
        "monthlySavings": savings.get("monthlySavings", 0),
    }


# ──────────────────────────────────────────
# BONUS: GET /api/savings
# ──────────────────────────────────────────
@router.get("/savings")
async def get_savings():
    """Get default savings summary."""
    return get_default_savings()
