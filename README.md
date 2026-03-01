
```
VoltVision
├─ README.md
├─ backend
│  ├─ app
│  │  ├─ __init__.py
│  │  ├─ api
│  │  │  ├─ __init__.py
│  │  │  └─ routes.py
│  │  ├─ core
│  │  │  ├─ __init__.py
│  │  │  ├─ auth.py
│  │  │  ├─ config.py
│  │  │  └─ gemini_config.py
│  │  ├─ data
│  │  │  └─ household_energy_inference_test_with_datetime.csv
│  │  ├─ db
│  │  │  ├─ data_crud.py
│  │  │  ├─ database.py
│  │  │  └─ user_crud.py
│  │  ├─ main.py
│  │  ├─ schemas
│  │  │  ├─ __init__.py
│  │  │  └─ schemas.py
│  │  ├─ services
│  │  │  ├─ __init__.py
│  │  │  ├─ ai_service.py
│  │  │  ├─ analytics_service.py
│  │  │  ├─ anomaly_service.py
│  │  │  ├─ email_service.py
│  │  │  ├─ forecasting_service.py
│  │  │  ├─ insight_summary_service.py
│  │  │  ├─ optimization_service.py
│  │  │  ├─ recommendation_engine.py
│  │  │  └─ tariff_service.py
│  │  ├─ state
│  │  │  ├─ __init__.py
│  │  │  └─ api_usage_tracker.py
│  │  └─ utils
│  │     ├─ __init__.py
│  │     ├─ data_cleaning.py
│  │     ├─ feature_engineering.py
│  │     └─ peak_detection.py
│  ├─ backend.md
│  ├─ models
│  │  ├─ isolation_forest_anomaly.pkl
│  │  └─ rf_energy_predictor.pkl
│  ├─ requirements.txt
│  ├─ run.sh
│  └─ structure.md
├─ docs
├─ frontend
│  ├─ .vite
│  │  └─ deps
│  │     ├─ _metadata.json
│  │     └─ package.json
│  ├─ README.md
│  ├─ bun.lock
│  ├─ bun.lockb
│  ├─ components.json
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public
│  │  ├─ favicon.ico
│  │  ├─ placeholder.svg
│  │  └─ robots.txt
│  ├─ src
│  │  ├─ App.css
│  │  ├─ App.tsx
│  │  ├─ components
│  │  │  ├─ AnomalyChart.tsx
│  │  │  ├─ ApplianceForm.tsx
│  │  │  ├─ CostCard.tsx
│  │  │  ├─ CurrentTariffCard.tsx
│  │  │  ├─ DataUpload.tsx
│  │  │  ├─ EnergyChatbot.tsx
│  │  │  ├─ GridStressCard.tsx
│  │  │  ├─ NavLink.tsx
│  │  │  ├─ PeakSummary.tsx
│  │  │  ├─ RecommendationCard.tsx
│  │  │  ├─ SavingsSummary.tsx
│  │  │  ├─ SmartRecommendations.tsx
│  │  │  ├─ UsageChart.tsx
│  │  │  └─ ui
│  │  │     ├─ accordion.tsx
│  │  │     ├─ alert-dialog.tsx
│  │  │     ├─ alert.tsx
│  │  │     ├─ aspect-ratio.tsx
│  │  │     ├─ avatar.tsx
│  │  │     ├─ badge.tsx
│  │  │     ├─ breadcrumb.tsx
│  │  │     ├─ button.tsx
│  │  │     ├─ calendar.tsx
│  │  │     ├─ card.tsx
│  │  │     ├─ carousel.tsx
│  │  │     ├─ chart.tsx
│  │  │     ├─ checkbox.tsx
│  │  │     ├─ collapsible.tsx
│  │  │     ├─ command.tsx
│  │  │     ├─ context-menu.tsx
│  │  │     ├─ dialog.tsx
│  │  │     ├─ drawer.tsx
│  │  │     ├─ dropdown-menu.tsx
│  │  │     ├─ form.tsx
│  │  │     ├─ hover-card.tsx
│  │  │     ├─ input-otp.tsx
│  │  │     ├─ input.tsx
│  │  │     ├─ label.tsx
│  │  │     ├─ menubar.tsx
│  │  │     ├─ navigation-menu.tsx
│  │  │     ├─ pagination.tsx
│  │  │     ├─ popover.tsx
│  │  │     ├─ progress.tsx
│  │  │     ├─ radio-group.tsx
│  │  │     ├─ resizable.tsx
│  │  │     ├─ scroll-area.tsx
│  │  │     ├─ select.tsx
│  │  │     ├─ separator.tsx
│  │  │     ├─ sheet.tsx
│  │  │     ├─ sidebar.tsx
│  │  │     ├─ skeleton.tsx
│  │  │     ├─ slider.tsx
│  │  │     ├─ sonner.tsx
│  │  │     ├─ switch.tsx
│  │  │     ├─ table.tsx
│  │  │     ├─ tabs.tsx
│  │  │     ├─ textarea.tsx
│  │  │     ├─ toast.tsx
│  │  │     ├─ toaster.tsx
│  │  │     ├─ toggle-group.tsx
│  │  │     ├─ toggle.tsx
│  │  │     ├─ tooltip.tsx
│  │  │     └─ use-toast.ts
│  │  ├─ context
│  │  │  └─ AuthContext.tsx
│  │  ├─ hooks
│  │  │  ├─ use-mobile.tsx
│  │  │  └─ use-toast.ts
│  │  ├─ index.css
│  │  ├─ lib
│  │  │  └─ utils.ts
│  │  ├─ main.tsx
│  │  ├─ pages
│  │  │  ├─ About.tsx
│  │  │  ├─ Contact.tsx
│  │  │  ├─ Index.tsx
│  │  │  ├─ Login.tsx
│  │  │  ├─ NotFound.tsx
│  │  │  └─ Signup.tsx
│  │  ├─ services
│  │  │  ├─ api.ts
│  │  │  └─ apiBase.ts
│  │  ├─ test
│  │  │  ├─ example.test.ts
│  │  │  └─ setup.ts
│  │  └─ vite-env.d.ts
│  ├─ tailwind.config.ts
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  ├─ vite.config.ts
│  └─ vitest.config.ts
├─ projectstructure.md
└─ runtime.txt

```