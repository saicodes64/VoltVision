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


# --- Forecast ---
class ForecastResponse(BaseModel):
    hourlyData: List[HourlyData]
    totalPredicted: float


# --- Cost ---
class CostResponse(BaseModel):
    dailyCost: float
    monthlyCost: float
    trend: Literal["up", "down"]
    trendPercent: float
    slabRisk: bool
    slabBreakdown: Optional[List[dict]] = None


# --- Optimize ---
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
