"""
Energy Data CRUD operations.
Stores and fetches energy analytics data per user.
"""
from typing import List, Dict
from datetime import datetime
from app.db.database import db

energy_collection = db["energy_data"] if db is not None else None


def clear_user_data(user_id: str) -> dict:
    """Delete ALL existing energy data for a user. Used before fresh uploads."""
    if energy_collection is None:
        return {"error": "Database not connected"}
    try:
        result = energy_collection.delete_many({"user_id": user_id})
        return {"deleted_count": result.deleted_count}
    except Exception as e:
        return {"error": str(e)}


def save_user_data(user_id: str, data: List[Dict]) -> dict:
    """
    Replace the user's energy data with the new dataset.
    Always clears existing records first so old uploads never interfere.
    """
    if energy_collection is None:
        return {"error": "Database not connected"}

    if not data:
        return {"error": "No data provided"}

    # Clear previous data first — ensures clean slate on every upload
    clear_user_data(user_id)

    # Attach user_id and upload timestamp to each record
    now = datetime.utcnow()
    records = []
    for d in data:
        record = d.copy()
        record["user_id"] = user_id
        record["uploaded_at"] = now
        records.append(record)

    # Insert fresh data
    try:
        result = energy_collection.insert_many(records)
        return {
            "message": "Data saved successfully",
            "inserted_count": len(result.inserted_ids)
        }
    except Exception as e:
        return {"error": str(e)}


def get_user_data(user_id: str) -> List[Dict]:
    """Retrieve all chronological energy data for a specific user."""
    if energy_collection is None:
        return []

    try:
        cursor = energy_collection.find({"user_id": user_id}, {"_id": 0}).sort("timestamp", 1)
        return list(cursor)
    except Exception:
        return []


def get_latest_24h_data(user_id: str) -> List[Dict]:
    """Retrieve the most recent 24 chronological energy data records for a specific user."""
    if energy_collection is None:
        return []

    try:
        cursor = energy_collection.find(
            {"user_id": user_id}, {"_id": 0}
        ).sort("timestamp", -1).limit(24)
        latest_data = list(cursor)
        latest_data.reverse()  # Restore chronological order
        return latest_data
    except Exception:
        return []
