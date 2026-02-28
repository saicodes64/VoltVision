"""
Track daily Gemini API usage.
Enforces the 20-call-per-day limit.
"""

from datetime import date
from app.core.gemini_config import GEMINI_DAILY_LIMIT


class APIUsageTracker:
    """Track and limit daily Gemini API calls."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._call_count = 0
        self._last_reset_date = date.today()

    def _maybe_reset(self):
        """Reset counter if it's a new day."""
        today = date.today()
        if today != self._last_reset_date:
            self._call_count = 0
            self._last_reset_date = today

    def can_make_call(self) -> bool:
        """Check if we can make another Gemini API call today."""
        self._maybe_reset()
        return self._call_count < GEMINI_DAILY_LIMIT

    def record_call(self):
        """Record a Gemini API call."""
        self._maybe_reset()
        self._call_count += 1

    def remaining_calls(self) -> int:
        """Get remaining API calls for today."""
        self._maybe_reset()
        return max(0, GEMINI_DAILY_LIMIT - self._call_count)

    def calls_made_today(self) -> int:
        self._maybe_reset()
        return self._call_count


# Global instance
api_tracker = APIUsageTracker()
