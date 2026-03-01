import { useState, useEffect } from 'react';
import { Zap, TrendingUp, AlertCircle, ShieldCheck, Info } from 'lucide-react';

interface TariffData {
    current_month_units: number;
    current_slab: string;
    marginal_cost_per_unit: number;
    slab_risk: string;
    units_to_next_slab: number | null;
}

const SLAB_INFO = [
    { range: '0–100', rate: 4.28 },
    { range: '101–300', rate: 11.10 },
    { range: '301–500', rate: 15.33 },
    { range: '501–1000', rate: 17.68 },
    { range: '>1000', rate: 17.68 },
];

const riskColor = {
    Low: 'text-savings border-savings/20 bg-savings/5',
    Medium: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5',
    High: 'text-peak border-peak/20 bg-peak/5',
};

const riskIcon = {
    Low: <ShieldCheck className="h-4 w-4 text-savings" />,
    Medium: <Info className="h-4 w-4 text-yellow-400" />,
    High: <AlertCircle className="h-4 w-4 text-peak" />,
};

const CurrentTariffCard = () => {
    const [data, setData] = useState<TariffData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTariff = async () => {
            try {
                const raw = localStorage.getItem('vv_auth');
                const token = raw ? JSON.parse(raw)?.token : null;

                const res = await fetch('/api/forecast', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });

                if (res.ok) {
                    const json = await res.json();
                    setData({
                        current_month_units: json.current_month_units ?? 0,
                        current_slab: json.current_slab ?? '0-100',
                        marginal_cost_per_unit: json.marginal_cost_per_unit ?? 4.28,
                        slab_risk: json.slab_risk ?? 'Low',
                        units_to_next_slab: json.units_to_next_slab ?? null,
                    });
                }
            } catch {
                // fallback silently
            } finally {
                setLoading(false);
            }
        };

        fetchTariff();
    }, []);

    const risk = (data?.slab_risk as keyof typeof riskColor) ?? 'Low';

    return (
        <div className="card-gradient rounded-xl border border-border p-6">
            {/* Header */}
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg energy-gradient">
                    <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Your Current Tariff Slab</h2>
                    <p className="text-sm text-muted-foreground">Live electricity rate based on monthly usage</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-24">
                    <span className="text-muted-foreground text-sm animate-pulse">Loading tariff data...</span>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Main Stats Row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-border bg-secondary/30 p-3">
                            <p className="text-xs text-muted-foreground">Monthly Usage</p>
                            <p className="text-xl font-bold text-foreground font-mono">
                                {data?.current_month_units ?? 0} <span className="text-sm font-normal text-muted-foreground">units</span>
                            </p>
                        </div>
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                            <p className="text-xs text-muted-foreground">Current Slab</p>
                            <p className="text-xl font-bold text-primary font-mono">{data?.current_slab}</p>
                        </div>
                    </div>

                    {/* Rate */}
                    <div className="rounded-lg border border-border bg-secondary/30 p-3 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground">Marginal Rate (per unit)</p>
                            <p className="text-2xl font-bold text-foreground font-mono">
                                ₹{data?.marginal_cost_per_unit?.toFixed(2)}
                            </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-primary opacity-30" />
                    </div>

                    {/* Units to next slab */}
                    {data?.units_to_next_slab != null && (
                        <div className="rounded-lg border border-border bg-secondary/30 p-3">
                            <p className="text-xs text-muted-foreground mb-1">Units before next slab</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-secondary rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full bg-primary transition-all"
                                        style={{
                                            width: `${Math.max(5, 100 - (data.units_to_next_slab / 200) * 100)}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-sm font-semibold text-foreground font-mono">
                                    {data.units_to_next_slab} left
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Slab risk indicator */}
                    <div className={`rounded-lg border p-3 flex items-center gap-3 ${riskColor[risk]}`}>
                        {riskIcon[risk]}
                        <div>
                            <p className="text-xs opacity-70">Slab Risk</p>
                            <p className="text-sm font-semibold">
                                {risk === 'High'
                                    ? `⚠ High — Only ${data?.units_to_next_slab} units before next slab!`
                                    : risk === 'Medium'
                                        ? `Moderate — ${data?.units_to_next_slab} units to next slab`
                                        : 'Low — You are safely within your slab'}
                            </p>
                        </div>
                    </div>

                    {/* All slabs reference */}
                    <div className="rounded-lg border border-border bg-secondary/20 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Tariff Reference</p>
                        <div className="space-y-1">
                            {SLAB_INFO.map(s => (
                                <div
                                    key={s.range}
                                    className={`flex justify-between text-xs px-2 py-1 rounded ${data?.current_slab === s.range
                                            ? 'bg-primary/15 text-primary font-semibold'
                                            : 'text-muted-foreground'
                                        }`}
                                >
                                    <span>{s.range} units</span>
                                    <span>₹{s.rate.toFixed(2)}/unit</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CurrentTariffCard;
