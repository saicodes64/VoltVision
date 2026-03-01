from pydantic import BaseModel
from typing import List, Optional, Literal


# --- Auth ---
class UserAuth(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    message: str
    user_id: str
    email: str
    token: str


# --- Upload ---
class UploadResponse(BaseModel):
    message: str
    rows_processed: int
    date_range: Optional[str] = None


# --- Hourly Data ---
class HourlyData(BaseModel):
    hour: int
    label: str
    actual: float
    predicted: float
    cost: float
    gridLoad: Literal["low", "moderate", "high"]


# --- Usage Analytics ---
class PeakHour(BaseModel):
    hour: str
    load: float
    gridStress: Literal["low", "moderate", "high"]


class GridStress(BaseModel):
    currentLoad: float
    maxCapacity: float
    level: Literal["low", "moderate", "high"]
    percentage: float


class UsageAnalyticsResponse(BaseModel):
    hourlyData: List[HourlyData]
    peakHours: List[PeakHour]
    gridStress: GridStress
    totalDailyUsage: float
    averageHourlyUsage: float


# --- Forecast (enriched with tariff info) ---
class ForecastResponse(BaseModel):
    hourlyData: List[HourlyData]
    totalPredicted: float
    current_month_units: float
    current_slab: str
    marginal_cost_per_unit: float
    slab_risk: str
    units_to_next_slab: Optional[int] = None


# --- Cost ---
class CostResponse(BaseModel):
    dailyCost: float
    monthlyCost: float
    trend: Literal["up", "down"]
    trendPercent: float
    slabRisk: bool
    slabBreakdown: Optional[List[dict]] = None


# --- Optimize (legacy /optimize endpoint) ---
class OptimizeRequest(BaseModel):
    name: str
    type: str = "home"
    power: float
    duration: float
    preferredTime: Optional[str] = None


class Recommendation(BaseModel):
    appliance: str
    currentTime: str
    recommendedTime: str
    savingsPercent: float
    savingsAmount: float
    co2Reduction: float


class SavingsData(BaseModel):
    beforeCost: float
    afterCost: float
    monthlySavings: float
    annualSavings: float
    carbonReduction: float
    treesSaved: float


class OptimizeResponse(BaseModel):
    recommendation: Recommendation
    savings: SavingsData


# --- Appliance Optimizer (new deterministic endpoint) ---
class ApplianceOptimizeRequest(BaseModel):
    appliance_name: str
    appliance_kwh: float
    duration_hours: float


class ApplianceOptimizeResponse(BaseModel):
    best_hour: str
    cost_if_run_now: float
    cost_if_run_at_best_time: float
    savings: float
    slab_impact: str


# --- Chat ---
class ChatRequest(BaseModel):
    user_message: str


class ChatResponse(BaseModel):
    reply: str
    api_calls_remaining: int
    cached: bool = False


# --- Dashboard Summary ---
class DashboardSummary(BaseModel):
    totalDailyUsage: float
    monthlyCost: float
    peakLoad: float
    monthlySavings: float


# --- Contact Form ---
class ContactRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str
