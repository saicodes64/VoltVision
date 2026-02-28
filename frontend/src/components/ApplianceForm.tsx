import { useState } from 'react';
import { api, type Recommendation } from '@/services/api';
import { Cpu, Loader2 } from 'lucide-react';

const ApplianceForm = () => {
  const [form, setForm] = useState({ name: '', type: 'home', power: '', duration: '', preferredTime: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Recommendation | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await api.optimize({ name: form.name, type: form.type, power: parseFloat(form.power), duration: parseFloat(form.duration) });
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="card-gradient rounded-xl border border-border p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg energy-gradient">
          <Cpu className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Appliance Optimizer</h2>
          <p className="text-sm text-muted-foreground">Get AI scheduling recommendations</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Appliance Name"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          required
        />
        <select
          className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={form.type}
          onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
        >
          <option value="home">🏠 Home Appliance</option>
          <option value="industrial">🏭 Industrial Equipment</option>
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Power (kWh)"
            type="number"
            step="0.1"
            value={form.power}
            onChange={e => setForm(p => ({ ...p, power: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Duration (hrs)"
            type="number"
            step="0.5"
            value={form.duration}
            onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
            required
          />
        </div>
        <input
          className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Preferred Time (optional)"
          value={form.preferredTime}
          onChange={e => setForm(p => ({ ...p, preferredTime: e.target.value }))}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg energy-gradient py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Optimizing...</> : '⚡ Optimize with AI'}
        </button>
      </form>

      {result && (
        <div className="mt-4 rounded-lg border border-savings/20 bg-savings/5 p-4 animate-slide-up">
          <p className="text-sm font-medium text-savings mb-2">✅ Recommendation Ready</p>
          <p className="text-xs text-muted-foreground">
            Run <span className="text-foreground font-medium">{result.appliance}</span> at{' '}
            <span className="text-savings font-medium">{result.recommendedTime}</span> instead of{' '}
            <span className="text-peak font-medium">{result.currentTime}</span>
          </p>
          <p className="text-xs text-savings mt-1 font-medium">Save {result.savingsPercent}% (₹{result.savingsAmount}/cycle)</p>
        </div>
      )}
    </div>
  );
};

export default ApplianceForm;
