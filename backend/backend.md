🔥 VoltVision Backend Requirements (With AI Chatbot)

⸻

1️⃣ Core Backend Responsibilities (Unchanged)

Backend must still:
	•	Ingest usage data
	•	Engineer features
	•	Forecast hourly load
	•	Calculate cost
	•	Optimize appliance schedule
	•	Return structured JSON

But now add:
	•	Insight summarization layer
	•	AI chatbot integration layer
	•	Gemini API management logic

⸻

2️⃣ AI Chatbot Integration Requirements

⸻

2.1 Chatbot Purpose

The chatbot must:
	•	Explain energy usage trends
	•	Suggest cost reduction strategies
	•	Answer user questions
	•	Recommend behavioral improvements

It must NOT:
	•	Replace forecasting model
	•	Replace optimization logic
	•	Perform heavy computation

AI is advisory only.

⸻

2.2 Gemini API Constraints
	•	Model: Gemini Flash 2.5
	•	Daily API limit: 20 calls
	•	Calls must be minimized

Therefore:
	•	No API call per user click
	•	No API call per small query
	•	No raw dataset transmission

Backend must control when calls are made.

⸻

3️⃣ Insight Compression Layer (Critical Requirement)

Before sending anything to Gemini, backend must:

Generate summarized metrics such as:
	•	Monthly total units
	•	Monthly projected cost
	•	Peak hour range
	•	Lowest load hour range
	•	Average daily usage
	•	% load concentrated in peak hours
	•	Recommended appliance shift time
	•	Estimated savings

Example compressed payload:

{
  "monthly_units": 820,
  "projected_cost": 7200,
  "peak_hours": [18, 19, 20],
  "lowest_hours": [2, 3, 4],
  "recommended_shift_hour": 14,
  "estimated_savings_percent": 17.5
}

This is what you send to Gemini.

Never send full CSV.

⸻

4️⃣ Chatbot Backend Route

POST /chat

Input:

{
  "user_message": "How can I reduce my electricity bill?"
}

Backend Steps:
	1.	Retrieve latest summarized metrics
	2.	Construct prompt template
	3.	Inject metrics
	4.	Send to Gemini API
	5.	Return short response

⸻

5️⃣ Prompt Engineering Requirement

Backend must construct structured prompt:

Example:

“You are an energy optimization assistant.
Here is the user’s energy summary:
	•	Monthly units: 820
	•	Projected cost: ₹7200
	•	Peak hours: 6PM–8PM
	•	Recommended shift time: 2PM
	•	Estimated savings: 17%

User question: {user_message}

Provide short actionable advice in under 100 words.”

This keeps responses concise and API-efficient.

⸻

6️⃣ API Call Management Requirement

Backend must:
	•	Track daily Gemini API calls
	•	Maintain in-memory counter
	•	Prevent exceeding 20 calls
	•	Return fallback message if limit reached

Example fallback:

“AI assistant is currently unavailable. Please try again tomorrow.”

⸻

7️⃣ Caching Requirement

To reduce API usage:

Backend must cache last chatbot response for:
	•	Same user message
	•	Same dataset state

If identical query is asked again → return cached response.

No new API call.

⸻

8️⃣ AI Usage Strategy (Very Important)

Gemini should only be called when:
	•	User explicitly interacts with chatbot
	•	User requests explanation
	•	User requests recommendations beyond fixed optimization logic

NOT for:
	•	Standard optimize route
	•	Cost calculation
	•	Forecasting
	•	Peak detection

All core logic must remain deterministic.

⸻

9️⃣ Additional Backend Modules Required

Add new service:

services/
 ├── ai_service.py
 ├── insight_summary_service.py


⸻

ai_service.py

Responsibilities:
	•	Construct prompt
	•	Call Gemini API
	•	Parse response
	•	Handle API limit
	•	Cache response

⸻

insight_summary_service.py

Responsibilities:
	•	Extract metrics from processed data
	•	Generate compressed insight JSON
	•	Prepare safe AI payload

⸻

🔟 Updated Backend Route List

Now your backend must include:
	1.	POST /upload-data
	2.	GET /usage-analytics
	3.	POST /forecast
	4.	POST /calculate-cost
	5.	POST /optimize
	6.	POST /chat   ← NEW

Optional:
7. GET /anomalies

⸻

1️⃣1️⃣ Non-Functional Requirements for AI Layer
	•	Response time under 3 seconds
	•	Max prompt size controlled
	•	No raw data leakage
	•	Clear error handling
	•	Environment variable for Gemini API key
	•	Secure API key storage (never hardcoded)

⸻

1️⃣2️⃣ Completion Criteria for AI Feature

Chatbot feature is considered complete when:
	•	It responds using summarized metrics
	•	It respects API limit
	•	It provides actionable suggestions
	•	It does not replace optimization engine
	•	It does not leak raw data

⸻

🔥 Critical Architecture Principle

AI layer is advisory.
Optimization layer is authoritative.

Do not let Gemini decide cheapest hour.
Your backend already calculates that.

Gemini only explains and enhances.

⸻

⚠ Brutal Advice

If Gemini integration starts consuming too much time,
make it minimal:
	•	One route
	•	One compressed summary
	•	One simple prompt
	•	No conversational memory

Keep it simple.

⸻

Now answer carefully:

Are you planning to allow multi-turn conversation memory with Gemini, or single-shot question-answer only?