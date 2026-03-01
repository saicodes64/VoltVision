import { useState } from 'react';
import { Cpu, Loader2, Clock, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Appliance {
  label: string;
  kwh: number;
}

const APPLIANCES: Appliance[] = [
  { label: 'Washing Machine', kwh: 1.2 },
  { label: 'Air Conditioner', kwh: 1.5 },
  { label: 'Water Heater', kwh: 2.0 },
  { label: 'Iron', kwh: 1.0 },
  { label: 'EV Charging', kwh: 7.0 },
  { label: 'Custom Appliance', kwh: 0 },
];

interface OptimizeResult {
  best_hour: string;
  cost_if_run_now: number;
  cost_if_run_at_best_time: number;
  savings: number;
  slab_impact: string;
  appliance_name: string;
  energy_per_run_kwh: number;
}

const ApplianceForm = () => {
  const [selectedAppliance, setSelectedAppliance] = useState<string>(APPLIANCES[0].label);
  const [customKwh, setCustomKwh] = useState('');
  const [duration, setDuration] = useState('1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applianceKwh = (): number => {
    const found = APPLIANCES.find(a => a.label === selectedAppliance);
    if (!found || found.kwh === 0) return parseFloat(customKwh) || 0;
    return found.kwh;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const raw = localStorage.getItem('vv_auth');
      const token = raw ? JSON.parse(raw)?.token : null;

      const res = await fetch('/api/optimize-appliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          appliance_name: selectedAppliance,
          appliance_kwh: applianceKwh(),
          duration_hours: parseFloat(duration),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Error ${res.status}`);
      }

      const data: OptimizeResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const isCustom = selectedAppliance === 'Custom Appliance';
  const isSafe = result?.slab_impact === 'Safe';

  return (
    <div className="card-gradient rounded-xl border border-border p-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg energy-gradient">
          <Cpu className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Appliance Optimizer</h2>
          <p className="text-sm text-muted-foreground">Find cheapest time to run your appliances</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Appliance dropdown */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Select Appliance</label>
          <select
            className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={selectedAppliance}
            onChange={e => setSelectedAppliance(e.target.value)}
          >
            {APPLIANCES.map(a => (
              <option key={a.label} value={a.label}>
                {a.label}{a.kwh > 0 ? ` (${a.kwh} kWh)` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Custom kWh input */}
        {isCustom && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Power Rating (kWh)</label>
            <input
              className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. 1.8"
              type="number"
              step="0.1"
              min="0.1"
              value={customKwh}
              onChange={e => setCustomKwh(e.target.value)}
              required={isCustom}
            />
          </div>
        )}

        {/* Duration */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Duration (hours)</label>
          <input
            className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="e.g. 1.5"
            type="number"
            step="0.5"
            min="0.5"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || (isCustom && !customKwh)}
          className="w-full rounded-lg energy-gradient py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Optimizing...</>
          ) : (
            '⚡ Find Best Time'
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-peak/20 bg-peak/5 p-3 text-xs text-peak">
          ⚠ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-5 space-y-3 animate-slide-up">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-savings" />
            <span className="text-sm font-semibold text-savings">Optimization Ready</span>
          </div>

          {/* Best time */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Recommended Time</p>
              <p className="text-lg font-bold text-primary">{result.best_hour}</p>
            </div>
          </div>

          {/* Cost comparison */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground">Cost if run now</p>
              <p className="text-base font-bold text-peak">₹{result.cost_if_run_now.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-savings/20 bg-savings/5 p-3">
              <p className="text-xs text-muted-foreground">Cost at best time</p>
              <p className="text-base font-bold text-savings">₹{result.cost_if_run_at_best_time.toFixed(2)}</p>
            </div>
          </div>

          {/* Savings */}
          <div className="rounded-lg border border-savings/20 bg-savings/5 p-3 flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-savings shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">You save</p>
              <p className="text-base font-bold text-savings">₹{result.savings.toFixed(2)} per run</p>
            </div>
          </div>

          {/* Slab impact */}
          <div className={`rounded-lg border p-3 flex items-center gap-3 ${isSafe ? 'border-savings/20 bg-savings/5' : 'border-peak/30 bg-peak/10'}`}>
            <AlertTriangle className={`h-4 w-4 shrink-0 ${isSafe ? 'text-savings' : 'text-peak'}`} />
            <div>
              <p className="text-xs text-muted-foreground">Slab Impact</p>
              <p className={`text-sm font-semibold ${isSafe ? 'text-savings' : 'text-peak'}`}>
                {result.slab_impact}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Energy used: {result.energy_per_run_kwh} kWh per run
          </p>
        </div>
      )}
    </div>
  );
};

export default ApplianceForm;
