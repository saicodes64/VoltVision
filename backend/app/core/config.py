import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_DIR = BASE_DIR / "models"
RF_MODEL_PATH = MODEL_DIR / "rf_energy_predictor.pkl"

# CORS
CORS_ORIGINS = [
    "http://localhost:8080",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:8080",
    "*",
]

# Tariff slabs (Indian residential — per prompt specification)
TARIFF_SLABS = [
    {"min": 0,    "max": 100,          "rate": 4.28,  "label": "0-100"},
    {"min": 101,  "max": 300,          "rate": 11.10, "label": "101-300"},
    {"min": 301,  "max": 500,          "rate": 15.33, "label": "301-500"},
    {"min": 501,  "max": 1000,         "rate": 17.68, "label": "501-1000"},
    {"min": 1001, "max": float("inf"), "rate": 17.68, "label": ">1000"},
]

# Fixed charges per month
FIXED_CHARGE_PER_MONTH = 50.0
DEMAND_CHARGE_PER_KW = 100.0

# Peak hour definition (6 PM to 10 PM)
PEAK_HOURS_START = 17
PEAK_HOURS_END = 22

# Cost per kWh for CO2 calculation (kg CO2 per kWh — India grid avg)
CO2_PER_KWH = 0.82

# Simulated data config
SIMULATION_DAYS = 30
