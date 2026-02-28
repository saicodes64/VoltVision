// Mock data and API simulation for VoltVision

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

const generateHourlyData = (): HourlyData[] => {
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

export const mockHourlyData = generateHourlyData();

export const mockPeakHours: PeakHour[] = [
  { hour: '18:00 - 19:00', load: 4.8, gridStress: 'high' },
  { hour: '19:00 - 20:00', load: 4.5, gridStress: 'high' },
  { hour: '17:00 - 18:00', load: 4.2, gridStress: 'high' },
];

export const mockCostProjection: CostProjection = {
  dailyCost: 186,
  monthlyCost: 5580,
  trend: 'up',
  trendPercent: 12,
  slabRisk: true,
};

export const mockRecommendation: Recommendation = {
  appliance: 'Washing Machine',
  currentTime: '7:00 PM (Peak)',
  recommendedTime: '2:00 PM (Off-Peak)',
  savingsPercent: 15,
  savingsAmount: 12,
  co2Reduction: 0.8,
};

export const mockSavings: SavingsData = {
  beforeCost: 5580,
  afterCost: 4464,
  monthlySavings: 1116,
  annualSavings: 13392,
  carbonReduction: 24,
  treesSaved: 3,
};

export const mockGridStress: GridStress = {
  currentLoad: 78,
  maxCapacity: 100,
  level: 'high',
  percentage: 78,
};

// Simulated API functions
export const api = {
  predict: async (): Promise<HourlyData[]> => {
    await new Promise(r => setTimeout(r, 500));
    return mockHourlyData;
  },

  calculateCost: async (): Promise<CostProjection> => {
    await new Promise(r => setTimeout(r, 300));
    return mockCostProjection;
  },

  optimize: async (_appliance: { name: string; type: string; power: number; duration: number }): Promise<Recommendation> => {
    await new Promise(r => setTimeout(r, 800));
    return mockRecommendation;
  },

  chat: async (message: string): Promise<string> => {
    await new Promise(r => setTimeout(r, 600));
    const responses: Record<string, string> = {
      default: "Based on your energy data, I can see some opportunities for optimization. Your peak usage occurs between 6-8 PM. Consider shifting heavy appliance usage to off-peak hours (10 AM - 4 PM) to save up to **15% on your monthly bill**.",
      bill: "Your projected monthly bill is **₹5,580**. This is 12% higher than last month due to increased peak-hour usage. By following my scheduling recommendations, you could bring it down to **₹4,464** — saving **₹1,116/month**.",
      peak: "Today's peak consumption hours are **6 PM to 8 PM** with loads reaching **4.8 kWh**. The grid stress level is HIGH during these hours. I recommend shifting your washing machine and dishwasher to **2 PM** when rates are lowest.",
      save: "Here's your savings potential:\n- **Monthly**: ₹1,116\n- **Annual**: ₹13,392\n- **Carbon**: 24 kg CO₂ reduced\n\nThe easiest win is shifting your washing machine cycle — it alone saves ₹12 per cycle!",
      appliance: "For heavy appliances, the best times to run them are:\n- **Washing Machine**: 2:00 PM\n- **Dishwasher**: 1:00 PM\n- **AC**: Use at 24°C with timer\n- **Water Heater**: 5:00 AM\n\nThese times align with off-peak tariff rates and low grid stress.",
    };

    const lower = message.toLowerCase();
    if (lower.includes('bill') || lower.includes('cost')) return responses.bill;
    if (lower.includes('peak') || lower.includes('high')) return responses.peak;
    if (lower.includes('save') || lower.includes('reduc')) return responses.save;
    if (lower.includes('appliance') || lower.includes('when') || lower.includes('run')) return responses.appliance;
    return responses.default;
  },
};
