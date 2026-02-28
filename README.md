
# ⚡ VoltVision  
### AI-Based Energy Consumption Optimizer  
**SIC - Code4Society Competition**  
**Team Axios**
1. Sai Surve
2. Shivam Bhatane
3. Pritesh Gholap
4. Tanishka Pol
5. Adhokshaj Kulkarni


## 📌 Problem Statement (PS: 02)

### AI-Based Energy Consumption Optimizer

#### 🔍 Description
Homes and industries waste electricity by running appliances inefficiently. VoltVision analyzes energy usage patterns to suggest the *greenest* and *most cost-efficient* times to operate high-load devices.

#### 🎯 Objective
- Reduce electricity bills  
- Minimize peak-load stress on the power grid  
- Promote sustainable energy habits  

#### 📊 Expected Outcomes
- Usage Analytics Dashboard showing peak consumption times  
- Smart Alerts (e.g., *"Run the washing machine at 2 PM to save 15%"*)

---

# 🏗 System Architecture

Frontend (React + TypeScript)
↓
FastAPI Backend (API Layer)
↓
Machine Learning Services
↓
MongoDB Database
↓
Gemini AI Chatbot

---

## 🧠 Architecture Layers

### 1️⃣ Frontend (Presentation Layer)
- React + TypeScript Dashboard
- Usage & Forecast Charts
- Anomaly Indicators
- Smart Recommendation Panel
- Energy AI Chatbot

### 2️⃣ Backend (Application Layer)
- FastAPI REST API
- ML Model Execution
- Recommendation Engine
- Authentication & User Management
- MongoDB Data Persistence

### 3️⃣ Machine Learning Layer
- Random Forest Regressor (Forecasting)
- Isolation Forest (Anomaly Detection)
- Rule-Based Optimization Engine

### 4️⃣ Database Layer
- MongoDB (User + Energy Data Storage)

---

# 🔄 Complete Workflow

---

## Step 1: Data Upload & Cleaning (Foundation)

**Input:** CSV file (`timestamp`, `usage_kwh`)

### Process:
- Parse CSV using pandas
- Fill missing values (median replacement)
- Remove negative anomalies
- Sort chronologically
- Store cleaned data in MongoDB linked to the user

---

## Step 2: 24-Hour Forecasting (Predictive AI)

### Model Used:
**Random Forest Regressor**

### Feature Engineering (9 Features):
- hour
- day_of_week
- month
- is_weekend
- rolling_mean_3h
- prev_usage
- peak_indicator
- hour_sin
- hour_cos

### Output:
- 24-hour predicted usage curve
- Hour-by-hour energy consumption forecast

---

## Step 3: Anomaly Detection (Security AI)

### Model Used:
**Isolation Forest**

### Purpose:
Detect abnormal energy spikes and drops.

### Process:
- Map kWh into expected model features:
  - Peak Power
  - Average Power
  - Expected Voltage
  - Max Current
- Detect outliers
- Assign severity score:
  - Medium
  - High

---

## Step 4: Recommendation Engine (Decision Brain)

Combines:
- Forecast output
- Anomaly detection
- Rule-based logic

### Optimization Rules

1. **High Load Warning**
   - If predicted peak > 3.5 kWh → Critical alert

2. **Sudden Spike Detection**
   - If usage increases > 1.8x → Warning alert

3. **Best Time Window**
   - Identify 3 lowest predicted hours
   - Suggest appliance shifting

4. **Trend Analysis**
   - Rising slope → Check standby loads
   - Flat slope → Positive confirmation

5. **Anomaly Alert**
   - Flag abnormal device behavior

6. **Recurring Fault Detection**
   - Same hour anomaly across days → Fault pattern

7. **Clean Health Score**
   - No peaks or anomalies → Positive status

### Final Output:
- Risk Score (0–100)
- Risk Level (Low / Medium / High)
- Actionable Recommendations

---

## Step 5: Frontend Visualization

### Dashboard Components

- **Usage Chart**
  - Historical + Forecast curve
- **Anomaly Chart**
  - Red / Orange markers
- **Smart Recommendations Panel**
  - Color-coded alerts
- **Savings Summary**
  - Cost reduction percentage
- **Energy Chatbot**
  - Natural language AI advice

---

# 🤖 Models Trained

### 1️⃣ Random Forest Regressor
- 24-hour forecasting
- Captures temporal patterns
- Stable ensemble predictions

### 2️⃣ Isolation Forest
- Unsupervised anomaly detection
- Identifies abnormal consumption behavior
- Prevents hidden device faults

---

# 🛠 Technologies Used

## 🔬 Machine Learning & AI
- **scikit-learn**
  - Random Forest Regressor
  - Isolation Forest
- **pandas & numpy**
  - Data processing & feature engineering
- **joblib**
  - Model serialization (.pkl)
- **Google Gemini AI**
  - Natural language chatbot advice

---

## ⚙ Backend
- **FastAPI**
- **Uvicorn**
- **python-jose (JWT)**
- **bcrypt**
- **pymongo**

---

## 🗄 Database
- **MongoDB**
  - User storage
  - Energy data storage
  - Flexible time-series documents

---

## 🎨 Frontend
- **React + TypeScript**
- **Vite**
- **Recharts**
- **Tailwind CSS**
- **Lucide React**
- **React Router**

---

# 📁 Project Structure

VoltVision/
├── frontend/ (React App)
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── state/
│   │   └── utils/
│   ├── models/
│   └── requirements.txt
└── README.md

---

# 🔐 Authentication Flow

1. User Signup  
2. Password hashed with bcrypt  
3. JWT issued  
4. Protected routes require token  
5. User-specific energy data retrieved  

---

# 💡 Key Innovation

VoltVision uses:

- **Predictive AI** to forecast energy usage  
- **Unsupervised AI** to detect hidden anomalies  
- **Rule-Based Optimization Engine** to generate actionable insights  
- **LLM-powered Chatbot** for natural language explanations  

It does not just display charts.  
It makes decisions.

---

# 🌍 Impact

- Lower electricity bills  
- Reduced peak grid stress  
- Improved energy awareness  
- Sustainable appliance usage habits  

---

# 🚀 How to Run

## Backend

cd backend
pip install -r requirements.txt
uvicorn app.main:app –reload

## Frontend

cd frontend
npm install
npm run dev

---

# 🏆 Team

**Team Axios**  
SIC - Code4Society Competition  


