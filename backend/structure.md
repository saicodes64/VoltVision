voltvision-backend/
│
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── routes.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── gemini_config.py
│   │
│   ├── models/
│   │   ├── forecast_model.pkl
│   │   ├── anomaly_model.pkl
│   │   ├── scaler.pkl (if used)
│   │
│   ├── schemas/
│   │   ├── upload_schema.py
│   │   ├── forecast_schema.py
│   │   ├── tariff_schema.py
│   │   ├── optimize_schema.py
│   │   ├── chat_schema.py
│   │   ├── response_schema.py
│   │
│   ├── services/
│   │   ├── forecasting_service.py
│   │   ├── analytics_service.py
│   │   ├── tariff_service.py
│   │   ├── optimization_service.py
│   │   ├── insight_summary_service.py
│   │   ├── ai_service.py
│   │
│   ├── utils/
│   │   ├── feature_engineering.py
│   │   ├── peak_detection.py
│   │   ├── data_cleaning.py
│   │
│   ├── state/
│   │   ├── data_store.py
│   │   ├── api_usage_tracker.py
│   │
├── requirements.txt
├── .env
├── run.sh
└── README.md