import { mockCostProjection } from '@/services/api';
import { IndianRupee, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const CostCard = () => {
  const { dailyCost, monthlyCost, trend, trendPercent, slabRisk } = mockCostProjection;

  return (
    <div className="card-gradient rounded-xl border border-primary/30 p-6 glow-blue relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 energy-gradient opacity-5 rounded-full -translate-y-8 translate-x-8" />

      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg energy-gradient">
          <IndianRupee className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cost Projection</h2>
          <p className="text-sm text-muted-foreground">AI-estimated electricity bill</p>
        </div>
      </div>

      <div className="mt-4 mb-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Projected Monthly Bill</p>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-extrabold text-gradient-blue font-mono">₹{monthlyCost.toLocaleString()}</span>
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trend === 'up' ? 'bg-peak/10 text-peak' : 'bg-savings/10 text-savings'}`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trendPercent}%
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-2.5 mt-4">
        <span className="text-xs text-muted-foreground">Daily Estimate</span>
        <span className="font-mono text-sm font-semibold text-foreground">₹{dailyCost}</span>
      </div>

      {slabRisk && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/20 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="text-xs font-medium text-warning">Approaching higher tariff slab</span>
        </div>
      )}
    </div>
  );
};

export default CostCard;
