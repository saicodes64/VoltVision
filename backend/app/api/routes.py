"""
API Routes — VoltVision FastAPI endpoints.
Authentication uses JWT Bearer tokens via Depends(get_current_user).
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from app.schemas.schemas import (
    UploadResponse, AuthResponse, UserAuth, ChatRequest, ChatResponse,
    DashboardSummary, OptimizeRequest,
)
from app.core.auth import get_current_user
from app.db.user_crud import create_user, authenticate_user
from app.db.data_crud import save_user_data, get_user_data, get_latest_24h_data
from app.utils.data_cleaning import clean_csv_data
from app.services.analytics_service import get_usage_analytics
from app.services.forecasting_service import forecasting_service
from app.services.anomaly_service import anomaly_service
from app.services.recommendation_engine import generate_recommendations
from app.services.tariff_service import calculate_cost
from app.services.optimization_service import optimize_appliance, get_default_savings
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api")


# ──────────────────────────────────────────
# AUTH — No token required
# ──────────────────────────────────────────

@router.post("/signup", response_model=AuthResponse)
async def signup(user: UserAuth):
    """Create a new account. Returns user details + JWT token."""
    result = create_user(user.email, user.password)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return AuthResponse(
        message="Account created successfully",
        user_id=result["user_id"],
        email=result["email"],
        token=result["token"],
    )


@router.post("/login", response_model=AuthResponse)
async def login(user: UserAuth):
    """Log in with email + password. Returns user details + JWT token."""
    result = authenticate_user(user.email, user.password)
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    return AuthResponse(
        message="Login successful",
        user_id=result["user_id"],
        email=result["email"],
        token=result["token"],
    )


# ──────────────────────────────────────────
# 1. POST /api/upload-data
# ──────────────────────────────────────────

@router.post("/upload-data", response_model=UploadResponse)
async def upload_data(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    """Upload CSV energy data for analysis. Requires JWT Bearer token."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    try:
        content = await file.read()
        csv_text = content.decode("utf-8")
        cleaned_data, date_range = clean_csv_data(csv_text)

        result = save_user_data(user_id, cleaned_data)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return UploadResponse(
            message=f"Successfully processed and saved {len(cleaned_data)} records",
            rows_processed=len(cleaned_data),
            date_range=date_range,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


# ──────────────────────────────────────────
# 2. GET /api/usage-analytics
# ──────────────────────────────────────────

@router.get("/usage-analytics")
async def usage_analytics(user_id: str = Depends(get_current_user)):
    """Get 24-hour usage analytics. Requires JWT Bearer token."""
    latest_24h = get_latest_24h_data(user_id)
    all_data = get_user_data(user_id)
    return get_usage_analytics(latest_24h, all_data)


# ──────────────────────────────────────────
# 3. GET /api/forecast
# ──────────────────────────────────────────

@router.get("/forecast")
async def forecast(user_id: str = Depends(get_current_user)):
    """Get next 24-hour energy usage forecast. Requires JWT Bearer token."""
    all_data = get_user_data(user_id)
    predictions = forecasting_service.predict_next_24h(all_data)

    from datetime import datetime, timedelta
    from app.utils.peak_detection import classify_grid_stress

    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    latest = get_latest_24h_data(user_id)

    hourly_data = []
    for i, pred in enumerate(predictions):
        target_time = now + timedelta(hours=i + 1)
        hour = target_time.hour
        actual = latest[i].get("actual_kwh", pred) if latest and i < len(latest) else pred
        grid_load = classify_grid_stress(pred)

        hourly_data.append({
            "hour": hour,
            "label": f"{hour:02d}:00",
            "actual": round(actual, 2),
            "predicted": round(pred, 2),
            "cost": round(pred * 6.5, 2),
            "gridLoad": grid_load,
        })

    return {"hourlyData": hourly_data, "totalPredicted": round(sum(predictions), 2)}


# ──────────────────────────────────────────
# 4. GET /api/calculate-cost
# ──────────────────────────────────────────

@router.get("/calculate-cost")
async def calc_cost(user_id: str = Depends(get_current_user)):
    """Calculate cost projection. Requires JWT Bearer token."""
    all_data = get_user_data(user_id)
    latest_24h = get_latest_24h_data(user_id)
    return calculate_cost(all_data, latest_24h)


# ──────────────────────────────────────────
# 5. POST /api/optimize
# ──────────────────────────────────────────

@router.post("/optimize")
async def optimize(
    request: OptimizeRequest,
    user_id: str = Depends(get_current_user),
):
    """Get appliance scheduling optimisation. Requires JWT Bearer token."""
    latest_24h = get_latest_24h_data(user_id)
    return optimize_appliance(
        latest_24h=latest_24h,
        name=request.name,
        appliance_type=request.type,
        power_kwh=request.power,
        duration_hrs=request.duration,
        preferred_time=request.preferredTime,
    )


# ──────────────────────────────────────────
# 6. POST /api/chat
# ──────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user_id: str = Depends(get_current_user),
):
    """AI chatbot endpoint. Requires JWT Bearer token."""
    latest_24h = get_latest_24h_data(user_id)
    all_data = get_user_data(user_id)
    result = await ai_service.chat(request.user_message, latest_24h, all_data)
    return ChatResponse(**result)


# ──────────────────────────────────────────
# GET /api/dashboard-summary
# ──────────────────────────────────────────

@router.get("/dashboard-summary")
async def dashboard_summary(user_id: str = Depends(get_current_user)):
    """Top stat cards summary. Requires JWT Bearer token."""
    all_data = get_user_data(user_id)
    latest_24h = get_latest_24h_data(user_id)

    analytics = get_usage_analytics(latest_24h, all_data)
    cost = calculate_cost(all_data, latest_24h)
    savings = get_default_savings(latest_24h, all_data)

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
# GET /api/savings
# ──────────────────────────────────────────

@router.get("/savings")
async def get_savings(user_id: str = Depends(get_current_user)):
    """Get savings summary. Requires JWT Bearer token."""
    all_data = get_user_data(user_id)
    latest_24h = get_latest_24h_data(user_id)
    return get_default_savings(latest_24h, all_data)


# ──────────────────────────────────────────
# GET /api/anomalies
# ──────────────────────────────────────────

@router.get("/anomalies")
async def get_anomalies(user_id: str = Depends(get_current_user)):
    """
    Run Isolation Forest anomaly detection on the user's stored 24h data.
    Returns: { records: [...], summary: {...} }
    """
    latest_24h = get_latest_24h_data(user_id)
    if not latest_24h:
        return {
            "records": [],
            "summary": {
                "total": 0, "anomaly_count": 0,
                "avg_kwh": 0, "max_kwh": 0,
                "anomaly_percent": 0, "anomaly_hours": [],
            },
        }

    # Run anomaly detection on historical data
    results = anomaly_service.detect(latest_24h)
    summary = anomaly_service.get_summary(results)

    # Ensure each record has the label field for display
    for r in results:
        if "label" not in r:
            r["label"] = f"{r.get('hour', 0):02d}:00"
        # Ensure serialisable (remove any ObjectId type if present)
        r.pop("_id", None)
        r.pop("uploaded_at", None)
        r.pop("user_id", None)

    return {"records": results, "summary": summary}


# ──────────────────────────────────────────
# GET /api/anomalies/forecast
# ──────────────────────────────────────────

@router.get("/anomalies/forecast")
async def get_anomalies_forecast(user_id: str = Depends(get_current_user)):
    """
    Run anomaly detection on the FORECASTED next 24 hours.
    Returns: { records: [...], summary: {...} }
    """
    all_data = get_user_data(user_id)
    predictions = forecasting_service.predict_next_24h(all_data)

    from datetime import datetime, timedelta
    from app.utils.peak_detection import classify_grid_stress

    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    forecast_records = []
    for i, pred in enumerate(predictions):
        target_time = now + timedelta(hours=i + 1)
        hour = target_time.hour
        forecast_records.append({
            "actual_kwh" : pred,
            "hour"       : hour,
            "day_of_week": target_time.weekday(),
            "label"      : f"{hour:02d}:00",
            "predicted"  : pred,
            "cost"       : round(pred * 6.5, 2),
            "gridLoad"   : classify_grid_stress(pred),
        })

    results = anomaly_service.detect(forecast_records)
    summary = anomaly_service.get_summary(results)
    return {"records": results, "summary": summary}


# ──────────────────────────────────────────
# GET /api/recommendations
# ──────────────────────────────────────────

@router.get("/recommendations")
async def get_recommendations(user_id: str = Depends(get_current_user)):
    """
    Run the full pipeline:
      1. RF model → 24-hour forecast
      2. IF model → anomaly detection on historical 24h data
      3. Recommendation engine → rule-based suggestions

    Returns structured JSON with risk_level, peak/anomaly hours, and actionable recommendations.
    Requires JWT Bearer token.
    """
    from datetime import datetime, timedelta
    from app.utils.peak_detection import classify_grid_stress

    all_data   = get_user_data(user_id)
    latest_24h = get_latest_24h_data(user_id)

    # Step 1 — RF forecast (next 24h)
    predictions = forecasting_service.predict_next_24h(all_data)
    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    forecast_records = []
    for i, pred in enumerate(predictions):
        target_time = now + timedelta(hours=i + 1)
        hour = target_time.hour
        forecast_records.append({
            "actual_kwh" : pred,
            "hour"       : hour,
            "day_of_week": target_time.weekday(),
            "label"      : f"{hour:02d}:00",
            "predicted"  : pred,
            "gridLoad"   : classify_grid_stress(pred),
        })

    # Step 2 — IF anomaly detection on historical data
    if latest_24h:
        anomaly_records = anomaly_service.detect(latest_24h)
        anomaly_summary = anomaly_service.get_summary(anomaly_records)
    else:
        anomaly_records = []
        anomaly_summary = {
            "total": 0, "anomaly_count": 0, "avg_kwh": 0,
            "max_kwh": 0, "anomaly_percent": 0, "anomaly_hours": [],
        }

    # Step 3 — Recommendation engine
    result = generate_recommendations(
        forecast_records=forecast_records,
        anomaly_records=anomaly_records,
        anomaly_summary=anomaly_summary,
    )

    return result
