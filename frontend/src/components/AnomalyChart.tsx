import { useState, useEffect } from 'react';
import {
    ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceDot, Legend,
} from 'recharts';
import { AlertTriangle, Activity, TrendingUp, Zap, CheckCircle } from 'lucide-react';
import { api } from '@/services/api';

interface AnomalyRecord {
    label: string;
    hour: number;
    actual_kwh: number;
    predicted?: number;
    cost?: number;
    gridLoad?: string;
    is_anomaly: boolean;
    anomaly_score: number;
    severity: 'normal' | 'medium' | 'high';
}

interface AnomalySummary {
    total: number;
    anomaly_count: number;
    avg_kwh: number;
    max_kwh: number;
    anomaly_percent: number;
    anomaly_hours: string[];
}

const severityColor = {
    high: 'hsl(0, 72%, 51%)',
    medium: 'hsl(38, 92%, 50%)',
    normal: 'transparent',
};

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d: AnomalyRecord = payload[0]?.payload;
    if (!d) return null;

    return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-xl text-xs space-y-1 min-w-[160px]">
            <p className="font-mono text-muted-foreground font-medium">{d.label}</p>
            <p><span className="text-primary">Usage:</span> {d.actual_kwh} kWh</p>
            {d.predicted !== undefined && (
                <p><span className="text-muted-foreground">Forecast:</span> {typeof d.predicted === 'number' ? d.predicted.toFixed(2) : d.predicted} kWh</p>
            )}
            {d.cost !== undefined && (
                <p><span className="text-savings">Cost:</span> ₹{d.cost}</p>
            )}
            {d.is_anomaly && (
                <p className={`font-semibold ${d.severity === 'high' ? 'text-peak' : 'text-warning'}`}>
                    ⚠ Anomaly — {d.severity} (score: {(d.anomaly_score * 100).toFixed(0)}%)
                </p>
            )}
        </div>
    );
};

interface Props {
    mode?: 'historical' | 'forecast';
}

const AnomalyChart = ({ mode = 'historical' }: Props) => {
    const [records, setRecords] = useState<AnomalyRecord[]>([]);
    const [summary, setSummary] = useState<AnomalySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        const fn = mode === 'forecast' ? api.getAnomalyForecast : api.getAnomalies;
        fn()
            .then(({ records: r, summary: s }) => {
                setRecords(r);
                setSummary(s);
            })
            .catch(e => setError(e.message ?? 'Failed to load anomaly data'))
            .finally(() => setLoading(false));
    }, [mode]);

    const anomalyDots = records.filter(r => r.is_anomaly);
    const maxVal = records.length ? Math.max(...records.map(r => r.actual_kwh)) : 10;

    const isHistorical = mode === 'historical';
    const title = isHistorical ? 'Anomaly Detection — Historical' : 'Anomaly Detection — 24h Forecast';
    const dataKey = isHistorical ? 'actual_kwh' : 'predicted';

    if (loading) {
        return (
            <div className="card-gradient rounded-xl border border-border p-6 animate-pulse">
                <div className="h-72 rounded-lg bg-muted" />
            </div>
        );
    }

    if (error || records.length === 0) {
        return (
            <div className="card-gradient rounded-xl border border-border p-6">
                <p className="text-center text-muted-foreground text-sm py-10">
                    {error || 'No data available. Upload a CSV to run anomaly detection.'}
                </p>
            </div>
        );
    }

    return (
        <div className="card-gradient rounded-xl border border-border p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg energy-gradient">
                    <AlertTriangle className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    <p className="text-sm text-muted-foreground">Isolation Forest · contamination=1%</p>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MiniStat
                        label="Records"
                        value={String(summary.total)}
                        icon={<Activity className="h-4 w-4" />}
                        color="text-primary"
                    />
                    <MiniStat
                        label="Anomalies"
                        value={String(summary.anomaly_count)}
                        icon={<AlertTriangle className="h-4 w-4" />}
                        color={summary.anomaly_count > 0 ? 'text-peak' : 'text-savings'}
                    />
                    <MiniStat
                        label="Avg Usage"
                        value={`${summary.avg_kwh} kWh`}
                        icon={<TrendingUp className="h-4 w-4" />}
                        color="text-muted-foreground"
                    />
                    <MiniStat
                        label="Peak"
                        value={`${summary.max_kwh} kWh`}
                        icon={<Zap className="h-4 w-4" />}
                        color="text-warning"
                    />
                </div>
            )}

            {/* Anomaly Badge List */}
            {summary && summary.anomaly_count > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs text-muted-foreground self-center">Flagged:</span>
                    {summary.anomaly_hours.map(h => (
                        <span key={h} className="rounded-full bg-peak/10 border border-peak/20 px-2 py-0.5 text-xs font-mono text-peak">
                            {h}
                        </span>
                    ))}
                </div>
            )}
            {summary && summary.anomaly_count === 0 && (
                <div className="flex items-center gap-2 text-savings text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>No anomalies detected in this period.</span>
                </div>
            )}

            {/* Legend */}
            <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-primary/70 inline-block" /> Usage</span>
                {!isHistorical && <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-muted-foreground/50 inline-block border-dashed border-t border-muted-foreground" /> Forecast</span>}
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-peak inline-block" /> Anomaly</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-warning inline-block" /> Medium risk</span>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={records} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                    <XAxis dataKey="label" stroke="hsl(215,20%,55%)" fontSize={11} tickLine={false} interval={3} />
                    <YAxis stroke="hsl(215,20%,55%)" fontSize={11} tickLine={false} axisLine={false} unit=" kWh" domain={[0, maxVal * 1.2]} />
                    <Tooltip content={<CustomTooltip />} />

                    {/* Main area */}
                    <Area
                        type="monotone"
                        dataKey={dataKey}
                        stroke="hsl(217, 91%, 60%)"
                        strokeWidth={2}
                        fill="url(#aGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: 'hsl(217, 91%, 60%)' }}
                    />

                    {/* Forecast line (forecast mode only) */}
                    {!isHistorical && (
                        <Line
                            type="monotone"
                            dataKey="actual_kwh"
                            stroke="hsl(215, 20%, 55%)"
                            strokeWidth={1.5}
                            strokeDasharray="5 4"
                            dot={false}
                        />
                    )}

                    {/* Anomaly dots */}
                    {anomalyDots.map((r, idx) => (
                        <ReferenceDot
                            key={`anom-${idx}`}
                            x={r.label}
                            y={r.actual_kwh}
                            r={7}
                            fill={severityColor[r.severity] || severityColor.medium}
                            stroke="hsl(0,72%,40%)"
                            strokeWidth={1.5}
                            label={{ value: '!', position: 'top', fill: 'hsl(0,72%,51%)', fontSize: 10, fontWeight: 700 }}
                        />
                    ))}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

const MiniStat = ({
    label, value, icon, color,
}: { label: string; value: string; icon: React.ReactNode; color: string }) => (
    <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
        <div className={`mb-0.5 ${color}`}>{icon}</div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
    </div>
);

export default AnomalyChart;
