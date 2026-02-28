import { mockSavings } from '@/services/api';
import { TreePine, TrendingDown, Leaf } from 'lucide-react';

const SavingsSummary = () => {
  const s = mockSavings;

  return (
    <div className="card-gradient rounded-xl border border-savings/20 p-6 glow-green">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg savings-gradient">
          <TrendingDown className="h-5 w-5 text-savings-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Savings Summary</h2>
          <p className="text-sm text-muted-foreground">Optimization impact analysis</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
          <span className="text-sm text-muted-foreground">Before Optimization</span>
          <span className="font-mono text-sm font-medium text-peak">₹{s.beforeCost.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
          <span className="text-sm text-muted-foreground">After Optimization</span>
          <span className="font-mono text-sm font-medium text-savings">₹{s.afterCost.toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="rounded-lg bg-savings/5 border border-savings/10 p-3 text-center">
            <p className="text-xl font-bold text-gradient-green font-mono">₹{s.monthlySavings.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Monthly Savings</p>
          </div>
          <div className="rounded-lg bg-savings/5 border border-savings/10 p-3 text-center">
            <p className="text-xl font-bold text-gradient-green font-mono">₹{s.annualSavings.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Annual Savings</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-savings/5 border border-savings/10 px-4 py-3 mt-2">
          <Leaf className="h-5 w-5 text-savings" />
          <div>
            <p className="text-sm font-medium text-savings">{s.carbonReduction} kg CO₂ reduced</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TreePine className="h-3 w-3" /> Equivalent to {s.treesSaved} trees planted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsSummary;
