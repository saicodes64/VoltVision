import { mockRecommendation } from '@/services/api';
import { Lightbulb, Clock, Leaf, ArrowRight } from 'lucide-react';

const RecommendationCard = () => {
  const r = mockRecommendation;

  return (
    <div className="card-gradient rounded-xl border border-savings/30 p-6 glow-green relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 savings-gradient opacity-5 rounded-full -translate-y-8 translate-x-8" />

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg savings-gradient animate-float">
          <Lightbulb className="h-5 w-5 text-savings-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Smart Recommendation</h2>
          <p className="text-sm text-muted-foreground">AI-optimized scheduling</p>
        </div>
      </div>

      <div className="rounded-lg bg-savings/5 border border-savings/10 p-4 mb-4">
        <p className="text-sm text-foreground leading-relaxed">
          Run <span className="font-bold text-savings">{r.appliance}</span> at{' '}
          <span className="font-bold text-savings">{r.recommendedTime}</span> instead of{' '}
          <span className="text-peak font-medium">{r.currentTime}</span> to save{' '}
          <span className="font-bold text-savings">{r.savingsPercent}%</span> (₹{r.savingsAmount} per cycle).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-secondary/50 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-peak mb-1">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">Current</span>
          </div>
          <p className="font-mono text-sm font-bold text-peak">{r.currentTime}</p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-savings mb-1">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">Optimal</span>
          </div>
          <p className="font-mono text-sm font-bold text-savings">{r.recommendedTime}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-muted/50 p-2 text-center">
          <p className="text-lg font-bold text-gradient-green">{r.savingsPercent}%</p>
          <p className="text-[10px] text-muted-foreground">Savings</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2 text-center">
          <p className="text-lg font-bold text-gradient-blue">₹{r.savingsAmount}</p>
          <p className="text-[10px] text-muted-foreground">Per Cycle</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2 text-center">
          <p className="text-lg font-bold text-gradient-green flex items-center justify-center gap-1"><Leaf className="h-3.5 w-3.5 text-savings" />{r.co2Reduction}</p>
          <p className="text-[10px] text-muted-foreground">kg CO₂</p>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
