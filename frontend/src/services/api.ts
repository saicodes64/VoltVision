// VoltVision API Service — connects to FastAPI backend
// Authenticated requests automatically attach the JWT Bearer token from localStorage.
//
// Set VITE_API_BASE_URL in your .env (or Render env vars) to point at the backend.
// Example: VITE_API_BASE_URL=https://voltvision-backend.onrender.com
// Leave empty in local dev if using the Vite proxy in vite.config.ts.

const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api`;
const STORAGE_KEY = 'vv_auth';

// ── Auth helpers ────────────────────────────────────────

function getToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw)?.token ?? null;
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Types ───────────────────────────────────────────────

export interface AuthUser {
  user_id: string;
  email: string;
  token: string;
}

export interface HourlyData {
  hour: number;
  label: string;
  actual: number;
  predicted: number;
  cost: number;
  gridLoad: 'low' | 'moderate' | 'high';
}

export interface PeakHour {
  hour: string;
  load: number;
  gridStress: 'low' | 'moderate' | 'high';
}

export interface CostProjection {
  dailyCost: number;
  monthlyCost: number;
  trend: 'up' | 'down';
  trendPercent: number;
  slabRisk: boolean;
}

export interface Recommendation {
  appliance: string;
  currentTime: string;
  recommendedTime: string;
  savingsPercent: number;
  savingsAmount: number;
  co2Reduction: number;
}

export interface SavingsData {
  beforeCost: number;
  afterCost: number;
  monthlySavings: number;
  annualSavings: number;
  carbonReduction: number;
  treesSaved: number;
}

export interface GridStress {
  currentLoad: number;
  maxCapacity: number;
  level: 'low' | 'moderate' | 'high';
  percentage: number;
}

export interface DashboardSummary {
  totalDailyUsage: number;
  monthlyCost: number;
  peakLoad: number;
  monthlySavings: number;
}

export interface UsageAnalytics {
  hourlyData: HourlyData[];
  peakHours: PeakHour[];
  gridStress: GridStress;
  totalDailyUsage: number;
  averageHourlyUsage: number;
}

export interface OptimizeResponse {
  recommendation: Recommendation;
  savings: SavingsData;
}

// ── Mock Data (fallback when backend is offline) ────────

const generateMockHourlyData = (): HourlyData[] => {
  const basePattern = [
    0.8, 0.6, 0.5, 0.4, 0.5, 0.7, 1.2, 2.1, 2.8, 3.2, 3.0, 2.6,
    2.4, 2.2, 2.5, 2.8, 3.5, 4.2, 4.8, 4.5, 3.8, 2.9, 1.8, 1.1,
  ];
  return basePattern.map((val, i) => {
    const predicted = val + (Math.random() - 0.5) * 0.4;
    const gridLoad: 'low' | 'moderate' | 'high' = val > 4 ? 'high' : val > 2.5 ? 'moderate' : 'low';
    return {
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      actual: parseFloat(val.toFixed(2)),
      predicted: parseFloat(predicted.toFixed(2)),
      cost: parseFloat((val * 6.5).toFixed(2)),
      gridLoad,
    };
  });
};

const mockFallback = {
  hourlyData: generateMockHourlyData(),
  peakHours: [
    { hour: '18:00 - 19:00', load: 4.8, gridStress: 'high' as const },
    { hour: '19:00 - 20:00', load: 4.5, gridStress: 'high' as const },
    { hour: '17:00 - 18:00', load: 4.2, gridStress: 'high' as const },
  ],
  gridStress: { currentLoad: 78, maxCapacity: 100, level: 'high' as const, percentage: 78 },
  costProjection: { dailyCost: 186, monthlyCost: 5580, trend: 'up' as const, trendPercent: 12, slabRisk: true },
  recommendation: {
    appliance: 'Washing Machine',
    currentTime: '7:00 PM (Peak)',
    recommendedTime: '2:00 PM (Off-Peak)',
    savingsPercent: 15,
    savingsAmount: 12,
    co2Reduction: 0.8,
  },
  savings: {
    beforeCost: 5580, afterCost: 4464, monthlySavings: 1116,
    annualSavings: 13392, carbonReduction: 24, treesSaved: 3,
  },
  dashboardSummary: { totalDailyUsage: 42.3, monthlyCost: 5580, peakLoad: 4.8, monthlySavings: 1116 },
};

// ── Fetch helper ────────────────────────────────────────

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    ...options,
  });
  if (!res.ok) {
    let detail = `API error: ${res.status}`;
    try {
      const body = await res.json();
      if (body.detail) detail = body.detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }
  return res.json();
}

// ── API Functions ──────────────────────────────────────

export const api = {
  /** Auth — login / signup */
  auth: {
    login: async (email: string, password: string): Promise<AuthUser> => {
      const res = await fetchAPI<AuthUser & { message: string }>('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return { user_id: res.user_id, email: res.email, token: res.token };
    },

    signup: async (email: string, password: string): Promise<AuthUser> => {
      const res = await fetchAPI<AuthUser & { message: string }>('/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      return { user_id: res.user_id, email: res.email, token: res.token };
    },
  },

  /** Get 24h usage analytics */
  getAnalytics: async (): Promise<UsageAnalytics> => {
    try {
      return await fetchAPI<UsageAnalytics>('/usage-analytics');
    } catch {
      return {
        hourlyData: mockFallback.hourlyData,
        peakHours: mockFallback.peakHours,
        gridStress: mockFallback.gridStress,
        totalDailyUsage: 42.3,
        averageHourlyUsage: 1.76,
      };
    }
  },

  /** Get 24h forecast from RF model */
  predict: async (): Promise<HourlyData[]> => {
    try {
      const res = await fetchAPI<{ hourlyData: HourlyData[] }>('/forecast');
      return res.hourlyData;
    } catch {
      return mockFallback.hourlyData;
    }
  },

  /** Get cost projection */
  calculateCost: async (): Promise<CostProjection> => {
    try {
      return await fetchAPI<CostProjection>('/calculate-cost');
    } catch {
      return mockFallback.costProjection;
    }
  },

  /** Optimize appliance scheduling */
  optimize: async (appliance: {
    name: string; type: string; power: number; duration: number; preferredTime?: string;
  }): Promise<OptimizeResponse> => {
    try {
      return await fetchAPI<OptimizeResponse>('/optimize', {
        method: 'POST',
        body: JSON.stringify(appliance),
      });
    } catch {
      return { recommendation: mockFallback.recommendation, savings: mockFallback.savings };
    }
  },

  /** AI chatbot */
  chat: async (message: string): Promise<string> => {
    try {
      const res = await fetchAPI<{ reply: string }>('/chat', {
        method: 'POST',
        body: JSON.stringify({ user_message: message }),
      });
      return res.reply;
    } catch {
      return "I'm having trouble connecting to the server. Please check your connection and try again.";
    }
  },

  /** Dashboard summary stats */
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    try {
      return await fetchAPI<DashboardSummary>('/dashboard-summary');
    } catch {
      return mockFallback.dashboardSummary;
    }
  },

  /** Get savings summary */
  getSavings: async (): Promise<SavingsData> => {
    try {
      return await fetchAPI<SavingsData>('/savings');
    } catch {
      return mockFallback.savings;
    }
  },

  /** Anomaly detection on historical data */
  getAnomalies: async (): Promise<{ records: any[]; summary: any }> => {
    try {
      return await fetchAPI<{ records: any[]; summary: any }>('/anomalies');
    } catch {
      return { records: [], summary: { total: 0, anomaly_count: 0, avg_kwh: 0, max_kwh: 0, anomaly_percent: 0, anomaly_hours: [] } };
    }
  },

  /** Anomaly detection on forecasted next 24h */
  getAnomalyForecast: async (): Promise<{ records: any[]; summary: any }> => {
    try {
      return await fetchAPI<{ records: any[]; summary: any }>('/anomalies/forecast');
    } catch {
      return { records: [], summary: { total: 0, anomaly_count: 0, avg_kwh: 0, max_kwh: 0, anomaly_percent: 0, anomaly_hours: [] } };
    }
  },

  /** Full pipeline: forecast + anomaly → smart recommendations */
  getRecommendations: async (): Promise<any> => {
    try {
      return await fetchAPI<any>('/recommendations');
    } catch {
      return null;
    }
  },

  /** Upload CSV data */
  uploadData: async (file: File): Promise<{ message: string; rows_processed: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload-data`, {
      method: 'POST',
      headers: authHeaders(), // no Content-Type — browser sets multipart boundary
      body: formData,
    });
    if (!res.ok) {
      let detail = `Upload failed: ${res.status}`;
      try { const b = await res.json(); if (b.detail) detail = b.detail; } catch { /* ignore */ }
      throw new Error(detail);
    }
    return res.json();
  },
};
