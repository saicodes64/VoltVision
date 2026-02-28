import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { api, type HourlyData } from '@/services/api';
import { Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload as HourlyData;
  if (!data) return null;

  const stressColors = { low: 'text-savings', moderate: 'text-warning', high: 'text-peak' };

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
      <p className="font-mono text-sm text-muted-foreground">{data.label}</p>
      <p className="text-sm"><span className="text-primary">Actual:</span> {data.actual} kWh</p>
      <p className="text-sm"><span className="text-muted-foreground">Predicted:</span> {data.predicted} kWh</p>
      <p className="text-sm"><span className="text-savings">Cost:</span> ₹{data.cost}</p>
      <p className={`text-sm font-medium ${stressColors[data.gridLoad]}`}>
        Grid: {data.gridLoad.toUpperCase()}
      </p>
    </div>
  );
};

const UsageChart = () => {
  const [data, setData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.predict().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="card-gradient rounded-xl border border-border p-6 animate-pulse">
        <div className="h-64 rounded-lg bg-muted" />
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    isPeak: d.gridLoad === 'high' ? d.actual : null,
    isGreen: d.gridLoad === 'low' ? d.actual : null,
  }));

  return (
    <div className="card-gradient rounded-xl border border-border p-6 glow-blue">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg energy-gradient">
          <Activity className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">AI Usage Analytics</h2>
          <p className="text-sm text-muted-foreground">24-hour energy consumption forecast</p>
        </div>
      </div>

      <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Actual</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground opacity-50" /> Predicted</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-peak" /> Peak</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-savings" /> Off-Peak</span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
          <XAxis dataKey="label" stroke="hsl(215, 20%, 55%)" fontSize={11} tickLine={false} interval={3} />
          <YAxis stroke="hsl(215, 20%, 55%)" fontSize={11} tickLine={false} axisLine={false} unit=" kWh" />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={4} stroke="hsl(0, 72%, 51%)" strokeDasharray="5 5" strokeOpacity={0.5} label={{ value: 'Peak Threshold', position: 'right', fill: 'hsl(0, 72%, 51%)', fontSize: 10 }} />
          <Area type="monotone" dataKey="actual" stroke="hsl(217, 91%, 60%)" strokeWidth={2.5} fill="url(#blueGrad)" dot={false} activeDot={{ r: 5, fill: 'hsl(217, 91%, 60%)' }} />
          <Line type="monotone" dataKey="predicted" stroke="hsl(215, 20%, 55%)" strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UsageChart;
