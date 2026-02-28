"""
AI Service — Gemini integration with caching, rate limiting, and prompt engineering.
"""

import hashlib
from typing import Dict, Optional
from collections import OrderedDict

from app.core.gemini_config import GEMINI_API_KEY, GEMINI_MODEL, SYSTEM_PROMPT
from app.state.api_usage_tracker import api_tracker
from app.services.insight_summary_service import generate_insight_summary, format_summary_for_prompt


class AIService:
    """Manages Gemini AI interactions with caching and rate limiting."""

    def __init__(self):
        self._cache: OrderedDict[str, str] = OrderedDict()
        self._max_cache_size = 50
        self._gemini_client = None
        self._init_gemini()

    def _init_gemini(self):
        """Initialize Gemini client if API key is available."""
        if not GEMINI_API_KEY:
            print("[AIService] ⚠️ No GEMINI_API_KEY set. Chatbot will use fallback responses.")
            return

        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            self._gemini_client = genai.GenerativeModel(GEMINI_MODEL)
            print(f"[AIService] ✅ Gemini client initialized with model: {GEMINI_MODEL}")
        except ImportError:
            print("[AIService] ⚠️ google-generativeai not installed. Using fallback responses.")
        except Exception as e:
            print(f"[AIService] ❌ Failed to init Gemini: {e}")

    async def chat(self, user_message: str, latest_24h: list, all_data: list) -> Dict:
        """
        Process a chat message. Steps:
        1. Check cache for identical query
        2. Check API rate limit
        3. Generate summary metrics
        4. Construct prompt
        5. Call Gemini
        6. Cache and return response
        """
        # 1. Check cache
        cache_key = self._make_cache_key(user_message)
        cached = self._cache.get(cache_key)
        if cached:
            return {
                "reply": cached,
                "api_calls_remaining": api_tracker.remaining_calls(),
                "cached": True,
            }

        # 2. Check rate limit
        if not api_tracker.can_make_call():
            return {
                "reply": "AI assistant has reached its daily limit (20 calls). Please try again tomorrow. In the meantime, check the dashboard for your energy insights!",
                "api_calls_remaining": 0,
                "cached": False,
            }

        # 3. Generate summary
        summary = generate_insight_summary(latest_24h, all_data)
        summary_text = format_summary_for_prompt(summary)

        # 4. Construct prompt
        prompt = self._build_prompt(user_message, summary_text)

        # 5. Call Gemini or use fallback
        if self._gemini_client:
            try:
                response = self._gemini_client.generate_content(prompt)
                reply = response.text.strip()
                api_tracker.record_call()
            except Exception as e:
                print(f"[AIService] ❌ Gemini API error: {e}")
                reply = self._fallback_response(user_message, summary)
        else:
            reply = self._fallback_response(user_message, summary)

        # 6. Cache
        self._add_to_cache(cache_key, reply)

        return {
            "reply": reply,
            "api_calls_remaining": api_tracker.remaining_calls(),
            "cached": False,
        }

    def _build_prompt(self, user_message: str, summary_text: str) -> str:
        """Build the complete prompt for Gemini."""
        return f"""{SYSTEM_PROMPT}

Here is the user's current energy summary:
{summary_text}

User question: {user_message}

Provide short, actionable advice in under 100 words. Use bullet points where helpful. Include specific numbers from the summary."""

    def _make_cache_key(self, message: str) -> str:
        """Create a cache key from the message."""
        normalized = message.strip().lower()
        return hashlib.md5(normalized.encode()).hexdigest()

    def _add_to_cache(self, key: str, value: str):
        """Add to cache with LRU eviction."""
        if len(self._cache) >= self._max_cache_size:
            self._cache.popitem(last=False)
        self._cache[key] = value

    def _fallback_response(self, message: str, summary: Dict) -> str:
        """Generate intelligent fallback response without Gemini."""
        lower = message.lower()
        cost = summary.get("projected_cost", 7200)
        peak_hours = summary.get("peak_hours", [18, 19, 20])
        savings_pct = summary.get("estimated_savings_percent", 17)
        shift_hour = summary.get("recommended_shift_hour", 14)
        daily_usage = summary.get("average_daily_usage", 27)

        peak_labels = [f"{h}:00" for h in peak_hours]
        shift_suffix = "AM" if shift_hour < 12 else "PM"
        shift_display = f"{shift_hour % 12 or 12}:00 {shift_suffix}"

        if any(w in lower for w in ["bill", "cost", "expensive", "charge"]):
            return f"Your projected monthly bill is **₹{cost:,.0f}**. Peak usage during {', '.join(peak_labels)} is driving costs up. By shifting heavy appliances to **{shift_display}** (off-peak), you could save approximately **{savings_pct}%** — that's around ₹{cost * savings_pct / 100:,.0f}/month."

        if any(w in lower for w in ["peak", "high", "stress"]):
            return f"Your peak consumption hours are **{', '.join(peak_labels)}** with grid stress reaching HIGH levels. Daily usage averages **{daily_usage} kWh**. I recommend shifting your washing machine and heavy appliances to **{shift_display}** when rates are lowest."

        if any(w in lower for w in ["save", "reduc", "cut", "lower"]):
            savings_amt = round(cost * savings_pct / 100)
            return f"Here's your savings potential:\n- **Monthly**: ₹{savings_amt:,}\n- **Annual**: ₹{savings_amt * 12:,}\n- **Method**: Shift heavy appliances to **{shift_display}**\n\nYour peak concentration is {summary.get('peak_concentration_pct', 35)}% — reducing this is your biggest win!"

        if any(w in lower for w in ["appliance", "when", "run", "schedule", "wash", "machine"]):
            return f"Best times to run heavy appliances:\n- **Washing Machine**: {shift_display}\n- **Dishwasher**: {shift_display}\n- **Water Heater**: 5:00 AM\n- **AC**: Use at 24°C with timer\n\nAvoid running these during {', '.join(peak_labels)} when grid stress is HIGH."

        if any(w in lower for w in ["hello", "hi", "hey"]):
            return f"Hello! 👋 I'm VoltVision AI. Your daily usage averages **{daily_usage} kWh** with a projected monthly bill of **₹{cost:,.0f}**. Ask me about saving money, peak hours, or appliance scheduling!"

        # Default
        return f"Based on your energy data, your peak usage occurs during {', '.join(peak_labels)}. Consider shifting heavy appliance usage to off-peak hours ({shift_display}) to save up to **{savings_pct}%** on your monthly bill of ₹{cost:,.0f}."


# Global instance
ai_service = AIService()
