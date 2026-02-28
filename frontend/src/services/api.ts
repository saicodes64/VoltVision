// VoltVision API Service — connects to FastAPI backend
// Falls back to mock data if backend is unreachable

const API_BASE = '/api';

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

// ─── Mock Data (fallback) ───────────────────────────────

const generateMockHourlyData = (): HourlyData[] => {
  const basePattern = [
    0.8, 0.6, 0.5, 0.4, 0.5, 0.7, 1.2, 2.1, 2.8, 3.2, 3.0, 2.6,
    2.4, 2.2, 2.5, 2.8, 3.5, 4.2, 4.8, 4.5, 3.8, 2.9, 1.8, 1.1
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
    appliance: 'Washing Machine', currentTime: '7:00 PM (Peak)',
    recommendedTime: '2:00 PM (Off-Peak)', savingsPercent: 15, savingsAmount: 12, co2Reduction: 0.8,
  },
  savings: {
    beforeCost: 5580, afterCost: 4464, monthlySavings: 1116,
    annualSavings: 13392, carbonReduction: 24, treesSaved: 3,
  },
  dashboardSummary: { totalDailyUsage: 42.3, monthlyCost: 5580, peakLoad: 4.8, monthlySavings: 1116 },
};

// ─── API Helper ─────────────────────────────────────────

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

// ─── API Functions ──────────────────────────────────────

export const api = {
  /** Get 24h usage analytics (hourly data, peaks, grid stress) */
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
      const res = await fetchAPI<{ hourlyData: HourlyData[] }>('/forecast', { method: 'POST' });
      return res.hourlyData;
    } catch {
      return mockFallback.hourlyData;
    }
  },

  /** Get cost projection */
  calculateCost: async (): Promise<CostProjection> => {
    try {
      return await fetchAPI<CostProjection>('/calculate-cost', { method: 'POST' });
    } catch {
      return mockFallback.costProjection;
    }
  },

  /** Optimize appliance scheduling */
  optimize: async (appliance: { name: string; type: string; power: number; duration: number; preferredTime?: string }): Promise<OptimizeResponse> => {
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
      return "I'm having trouble connecting to the server. Please make sure the backend is running on port 8000.";
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

  /** Upload CSV data */
  uploadData: async (file: File): Promise<{ message: string; rows_processed: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload-data`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },
};
