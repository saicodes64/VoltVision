"""
Data cleaning utilities for uploaded CSV files.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Optional
from io import StringIO


def clean_csv_data(csv_content: str) -> Tuple[List[Dict], str]:
    """
    Clean and validate uploaded CSV data.
    
    Expected columns (flexible matching):
    - timestamp/datetime/date + time
    - usage/kwh/consumption/load
    
    Returns: (cleaned_hourly_data, status_message)
    """
    try:
        df = pd.read_csv(StringIO(csv_content))
    except Exception as e:
        raise ValueError(f"Failed to parse CSV: {str(e)}")

    if df.empty:
        raise ValueError("CSV is empty")

    # --- Detect timestamp column ---
    ts_col = _find_column(df, ["timestamp", "datetime", "date_time", "time", "date"])
    if ts_col is None:
        raise ValueError("No timestamp/datetime column found. Expected: timestamp, datetime, date_time, time, or date")

    # --- Detect usage column ---
    usage_col = _find_column(df, ["usage", "kwh", "consumption", "load", "energy", "power", "actual_kwh"])
    if usage_col is None:
        raise ValueError("No usage column found. Expected: usage, kwh, consumption, load, energy, power, or actual_kwh")

    # Parse timestamps
    df["parsed_ts"] = pd.to_datetime(df[ts_col], errors="coerce")
    null_ts = df["parsed_ts"].isna().sum()
    if null_ts > 0:
        df = df.dropna(subset=["parsed_ts"])

    # Parse usage as numeric
    df["parsed_usage"] = pd.to_numeric(df[usage_col], errors="coerce")
    null_usage = df["parsed_usage"].isna().sum()
    if null_usage > 0:
        df["parsed_usage"] = df["parsed_usage"].fillna(df["parsed_usage"].median())

    # Sort chronologically
    df = df.sort_values("parsed_ts").reset_index(drop=True)

    # Remove negative values
    df["parsed_usage"] = df["parsed_usage"].clip(lower=0)

    # Extract features
    data = []
    for _, row in df.iterrows():
        ts = row["parsed_ts"]
        data.append({
            "timestamp": ts.isoformat(),
            "hour": ts.hour,
            "day_of_week": ts.weekday(),
            "month": ts.month,
            "is_weekend": ts.weekday() >= 5,
            "actual_kwh": round(float(row["parsed_usage"]), 2),
        })

    date_range = f"{df['parsed_ts'].min().strftime('%Y-%m-%d')} to {df['parsed_ts'].max().strftime('%Y-%m-%d')}"
    status = f"Processed {len(data)} records. Dropped {null_ts} invalid timestamps."

    return data, date_range


def _find_column(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
    """Find a column matching any of the candidate names (case-insensitive)."""
    cols_lower = {c.lower().strip(): c for c in df.columns}
    for candidate in candidates:
        if candidate.lower() in cols_lower:
            return cols_lower[candidate.lower()]
    return None
