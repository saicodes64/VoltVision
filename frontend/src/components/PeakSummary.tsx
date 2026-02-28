import { mockPeakHours, mockGridStress } from '@/services/api';
import { Zap, AlertTriangle } from 'lucide-react';

const stressConfig = {
  low: { color: 'bg-savings', text: 'text-savings', label: '🟢 Low' },
  moderate: { color: 'bg-warning', text: 'text-warning', label: '🟡 Moderate' },
  high: { color: 'bg-peak', text: 'text-peak', label: '🔴 High' },
};

const PeakSummary = () => {
  const maxLoad = Math.max(...mockPeakHours.map(p => p.load));
  const threshold = 4.0;
  const exceeded = maxLoad > threshold;

  return (
    <div className="card-gradient rounded-xl border border-border p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg peak-gradient">
          <Zap className="h-5 w-5 text-peak-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Peak Consumption</h2>
          <p className="text-sm text-muted-foreground">Top 3 peak hours today</p>
        </div>
      </div>

      {exceeded && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-peak/10 border border-peak/20 px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-peak" />
          <span className="text-sm font-medium text-peak">High Peak Load – Consider Load Shifting</span>
        </div>
      )}

      <div className="space-y-3">
        {mockPeakHours.map((peak, i) => {
          const cfg = stressConfig[peak.gridStress];
          return (
            <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
              <div>
                <p className="font-mono text-sm font-medium text-foreground">{peak.hour}</p>
                <p className="text-xs text-muted-foreground">{peak.load} kWh</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${cfg.color}`} />
                <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
        <span className="text-xs text-muted-foreground">Max Load</span>
        <span className="font-mono text-sm font-bold text-foreground">{maxLoad} kWh</span>
      </div>
    </div>
  );
};

export default PeakSummary;
