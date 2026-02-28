import { mockGridStress } from '@/services/api';
import { Gauge, Info } from 'lucide-react';

const GridStressCard = () => {
  const g = mockGridStress;
  const colorMap = { low: 'text-savings', moderate: 'text-warning', high: 'text-peak' };
  const bgMap = { low: 'bg-savings', moderate: 'bg-warning', high: 'bg-peak' };
  const glowMap = { low: 'glow-green', moderate: '', high: 'glow-red' };

  return (
    <div className={`card-gradient rounded-xl border border-border p-6 ${glowMap[g.level]}`}>
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${g.level === 'high' ? 'peak-gradient' : g.level === 'moderate' ? 'bg-warning' : 'savings-gradient'}`}>
          <Gauge className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Grid Stress</h2>
          <p className="text-sm text-muted-foreground">Current power grid status</p>
        </div>
      </div>

      <div className="mb-4 text-center">
        <p className={`text-5xl font-extrabold font-mono ${colorMap[g.level]}`}>{g.percentage}%</p>
        <p className={`text-sm font-medium mt-1 ${colorMap[g.level]}`}>{g.level.toUpperCase()} STRESS</p>
      </div>

      <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden mb-4">
        <div
          className={`absolute left-0 top-0 h-full rounded-full ${bgMap[g.level]} transition-all duration-1000`}
          style={{ width: `${g.percentage}%` }}
        />
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Shifting load to off-peak hours reduces grid pressure and prevents blackouts in your area.
        </p>
      </div>
    </div>
  );
};

export default GridStressCard;
