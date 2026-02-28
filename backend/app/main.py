"""
VoltVision Backend — FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CORS_ORIGINS
from app.api.routes import router


app = FastAPI(
    title="VoltVision API",
    description="AI-powered energy optimization backend",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(router)


@app.on_event("startup")
async def startup_event():
    """Initialize data and load models on startup."""
    print("=" * 60)
    print("⚡ VoltVision Backend Starting...")
    print("=" * 60)

    # Data is now fetched per-user from MongoDB.

    # Model loading happens in forecasting_service import
    from app.services.forecasting_service import forecasting_service
    if forecasting_service.model_loaded:
        print("[Startup] ✅ Random Forest model ready")
    else:
        print("[Startup] ⚠️ RF model not loaded — using fallback predictions")

    # AI service init happens on import
    from app.services.ai_service import ai_service
    print("[Startup] ✅ AI service ready")

    print("=" * 60)
    print("⚡ VoltVision Backend Ready!")
    print("📊 Dashboard: http://localhost:8080")
    print("🔌 API: http://localhost:8000/docs")
    print("=" * 60)


@app.get("/")
async def root():
    return {
        "name": "VoltVision API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    from app.services.forecasting_service import forecasting_service
    from app.state.api_usage_tracker import api_tracker

    return {
        "status": "healthy",
        "model_loaded": forecasting_service.model_loaded,
        "gemini_calls_remaining": api_tracker.remaining_calls(),
    }
