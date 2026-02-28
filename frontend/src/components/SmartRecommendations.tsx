import { useState, useEffect } from 'react';
import {
    Lightbulb, AlertTriangle, TrendingUp, CheckCircle2,
    Zap, Clock, Wrench, ShieldAlert, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '@/services/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface Recommendation {
    priority: 'critical' | 'warning' | 'info' | 'positive';
    icon: string;
    title: string;
    description: string;
    action: string;
}

interface RecommendationResult {
    risk_level: 'low' | 'medium' | 'high';
    risk_score: number;
    peak_hours: number[];
    low_hours: number[];
    anomaly_hours: string[];
    forecast_trend: 'rising' | 'falling' | 'stable';
    recommendations: Recommendation[];
    stats: {
        avg_predicted: number;
        max_predicted: number;
        std_predicted: number;
        anomaly_count: number;
        anomaly_pct: number;
    };
}

// ── Style maps ───────────────────────────────────────────────────────────────

const priorityStyles = {
    critical: {
        border: 'border-peak/40',
        bg: 'bg-peak/5',
        badge: 'bg-peak/15 text-peak border border-peak/30',
        dot: 'bg-peak',
        label: 'Critical',
    },
    warning: {
        border: 'border-warning/40',
        bg: 'bg-warning/5',
        badge: 'bg-warning/15 text-warning border border-warning/30',
        dot: 'bg-warning',
        label: 'Warning',
    },
    info: {
        border: 'border-primary/30',
        bg: 'bg-primary/5',
        badge: 'bg-primary/15 text-primary border border-primary/30',
        dot: 'bg-primary',
        label: 'Info',
    },
    positive: {
        border: 'border-savings/30',
        bg: 'bg-savings/5',
        badge: 'bg-savings/15 text-savings border border-savings/30',
        dot: 'bg-savings',
        label: 'Good',
    },
};

const riskBadge = {
    high: 'bg-peak/15 text-peak border border-peak/40',
    medium: 'bg-warning/15 text-warning border border-warning/40',
    low: 'bg-savings/15 text-savings border border-savings/40',
};

const riskRingColor = {
    high: 'hsl(0, 72%, 51%)',
    medium: 'hsl(38, 92%, 50%)',
    low: 'hsl(142, 71%, 45%)',
};

const trendLabel = {
    rising: { text: 'Rising ↑', cls: 'text-peak' },
    falling: { text: 'Falling ↓', cls: 'text-savings' },
    stable: { text: 'Stable →', cls: 'text-muted-foreground' },
};

// ── Component ─────────────────────────────────────────────────────────────────

const SmartRecommendations = () => {
    const [data, setData] = useState<RecommendationResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));  // first card open
    const [refreshing, setRefreshing] = useState(false);

    const load = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const res = await api.getRecommendations();
            setData(res);
            setExpanded(new Set([0]));
        } catch { /* api.ts fallback already handles empty */ }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { load(); }, []);

    const toggleCard = (idx: number) => {
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(idx) ? next.delete(idx) : next.add(idx);
            return next;
        });
    };

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="card-gradient rounded-xl border border-border p-6 space-y-4 animate-pulse">
                <div className="h-6 w-48 rounded bg-muted" />
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-lg bg-muted" />)}
                </div>
            </div>
        );
    }

    if (!data || data.recommendations.length === 0) {
        return (
            <div className="card-gradient rounded-xl border border-border p-6">
                <p className="text-center text-muted-foreground text-sm py-10">
                    No recommendation data yet. Upload a CSV to run the analysis pipeline.
                </p>
            </div>
        );
    }

    const { risk_level, risk_score, peak_hours, low_hours, anomaly_hours, forecast_trend, recommendations, stats } = data;
    const trend = trendLabel[forecast_trend];

    // Sort: critical → warning → info → positive
    const order = { critical: 0, warning: 1, info: 2, positive: 3 };
    const sorted = [...recommendations].sort((a, b) => order[a.priority] - order[b.priority]);

    return (
        <div className="card-gradient rounded-xl border border-border p-6 space-y-5">

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg energy-gradient">
                        <Lightbulb className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Smart Recommendations</h2>
                        <p className="text-sm text-muted-foreground">Forecast + Anomaly → AI-driven suggestions</p>
                    </div>
                </div>
                <button
                    onClick={() => load(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* ── Risk gauge row ── */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Risk gauge */}
                <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-4 py-2.5">
                    <div className="relative h-10 w-10">
                        <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(222,30%,18%)" strokeWidth="4" />
                            <circle
                                cx="18" cy="18" r="14"
                                fill="none"
                                stroke={riskRingColor[risk_level]}
                                strokeWidth="4"
                                strokeDasharray={`${risk_score * 0.88} 88`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                            {risk_score}
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Score</p>
                        <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${riskBadge[risk_level]}`}>
                            {risk_level.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Quick stats pill row */}
                <div className="flex flex-wrap gap-2">
                    <Pill icon={<TrendingUp className="h-3 w-3" />} label="Trend" value={trend.text} cls={trend.cls} />
                    <Pill icon={<Zap className="h-3 w-3" />} label="Peak forecast" value={`${stats.max_predicted} kWh`} cls="text-peak" />
                    <Pill icon={<AlertTriangle className="h-3 w-3" />} label="Anomalies" value={String(stats.anomaly_count)} cls={stats.anomaly_count > 0 ? 'text-peak' : 'text-savings'} />
                </div>
            </div>

            {/* ── Context chips ── */}
            <div className="space-y-2">
                {peak_hours.length > 0 && (
                    <HourChips
                        label="⚡ Forecast peaks"
                        hours={peak_hours.map(h => `${h.toString().padStart(2, '0')}:00`)}
                        chipCls="bg-peak/10 border-peak/20 text-peak"
                    />
                )}
                {low_hours.length > 0 && (
                    <HourChips
                        label="🌙 Lowest load"
                        hours={low_hours.map(h => `${h.toString().padStart(2, '0')}:00`)}
                        chipCls="bg-savings/10 border-savings/20 text-savings"
                    />
                )}
                {anomaly_hours.length > 0 && (
                    <HourChips
                        label="⚠ Anomaly hours"
                        hours={anomaly_hours.slice(0, 6)}
                        chipCls="bg-warning/10 border-warning/20 text-warning"
                    />
                )}
            </div>

            {/* ── Recommendation cards ── */}
            <div className="space-y-3">
                {sorted.map((rec, idx) => {
                    const s = priorityStyles[rec.priority];
                    const open = expanded.has(idx);
                    return (
                        <div
                            key={idx}
                            className={`rounded-xl border ${s.border} ${s.bg} overflow-hidden transition-all`}
                        >
                            <button
                                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                                onClick={() => toggleCard(idx)}
                            >
                                <span className={`h-2 w-2 rounded-full shrink-0 ${s.dot}`} />
                                <span className="text-lg leading-none">{rec.icon}</span>
                                <span className="flex-1 text-sm font-medium text-foreground">{rec.title}</span>
                                <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${s.badge}`}>
                                    {s.label}
                                </span>
                                {open
                                    ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                                    : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                }
                            </button>

                            {open && (
                                <div className="px-4 pb-4 space-y-2 border-t border-border/30 pt-3">
                                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                                    <div className="flex items-start gap-2 rounded-lg bg-secondary/30 px-3 py-2">
                                        <Wrench className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                        <p className="text-xs text-foreground">{rec.action}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const Pill = ({
    icon, label, value, cls,
}: { icon: React.ReactNode; label: string; value: string; cls: string }) => (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/30 px-3 py-1.5">
        <span className={cls}>{icon}</span>
        <span className="text-[10px] text-muted-foreground">{label}:</span>
        <span className={`text-xs font-semibold ${cls}`}>{value}</span>
    </div>
);

const HourChips = ({
    label, hours, chipCls,
}: { label: string; hours: string[]; chipCls: string }) => (
    <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{label}:</span>
        {hours.map(h => (
            <span key={h} className={`text-xs font-mono rounded-full border px-2 py-0.5 ${chipCls}`}>{h}</span>
        ))}
    </div>
);

export default SmartRecommendations;
