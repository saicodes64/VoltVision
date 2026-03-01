import { Link } from 'react-router-dom';
import {
    Zap, Github, Users, Target, Lightbulb, TrendingDown,
    ArrowLeft, Mail, BarChart3, Shield, Cpu, Upload
} from 'lucide-react';

const TEAM = [
    { name: 'Sai Surve', role: 'Lead Developer' },
    { name: 'Shivam Bhatane', role: 'ML Engineer' },
    { name: 'Pritesh Gholap', role: 'Backend Developer' },
    { name: 'Tanishka Pol', role: 'Frontend Developer' },
    { name: 'Adhokshaj Kulkarni', role: 'Data Analyst' },
];

const OBJECTIVES = [
    { icon: <BarChart3 className="h-5 w-5 text-primary" />, title: 'Real-Time Monitoring', desc: 'Track hourly energy consumption with visual analytics and peak load detection.' },
    { icon: <Cpu className="h-5 w-5 text-primary" />, title: 'ML-Powered Forecasting', desc: 'Random Forest model predicts next 24-hour usage to help plan ahead and reduce waste.' },
    { icon: <Shield className="h-5 w-5 text-primary" />, title: 'Anomaly Detection', desc: 'Isolation Forest model automatically flags abnormal consumption patterns.' },
    { icon: <TrendingDown className="h-5 w-5 text-savings" />, title: 'Cost Optimization', desc: 'Slab-based Indian tariff logic + appliance scheduler to minimize electricity bills.' },
];

const HOW_TO_USE = [
    { step: '1', icon: <Upload className="h-4 w-4" />, title: 'Upload CSV', desc: 'Upload your hourly energy data CSV with timestamp and usage_kwh columns.' },
    { step: '2', icon: <BarChart3 className="h-4 w-4" />, title: 'View Analytics', desc: 'Dashboard auto-populates with usage charts, peak hours, and cost projections.' },
    { step: '3', icon: <Cpu className="h-4 w-4" />, title: 'Get Forecast', desc: 'RF model predicts the next 24 hours with grid stress and tariff-based cost.' },
    { step: '4', icon: <Lightbulb className="h-4 w-4" />, title: 'Optimize Appliances', desc: 'Use the Appliance Optimizer to find the cheapest time to run your devices.' },
];

const About = () => (
    <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 py-3 flex items-center gap-4">
                <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm">Dashboard</span>
                </Link>
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg energy-gradient">
                        <Zap className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">About VoltVision</span>
                </div>
                <nav className="ml-auto flex gap-4">
                    <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
                    <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
                </nav>
            </div>
        </header>

        <main className="container mx-auto px-4 py-10 max-w-4xl space-y-8">

            {/* Hero Card */}
            <div className="card-gradient rounded-xl border border-primary/20 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 energy-gradient opacity-[0.03]" />
                <div className="relative">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl energy-gradient shadow-lg">
                            <Zap className="h-8 w-8 text-primary-foreground" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-1">VoltVision</h1>
                    <p className="text-primary font-medium mb-1">AI-Based Energy Consumption Optimizer</p>
                    <p className="text-sm text-muted-foreground mb-4">SIC – Code4Society Competition · Team Axios</p>
                    <a
                        href="https://github.com/saicodes64/VoltVision"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                    >
                        <Github className="h-4 w-4" />
                        github.com/saicodes64/VoltVision
                    </a>
                </div>
            </div>

            {/* Problem + Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card-gradient rounded-xl border border-border p-6">
                    <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-peak inline-block" /> Problem Statement
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Indian households and small businesses lack affordable tools to monitor and optimize electricity consumption.
                        Without visibility into usage patterns, consumers overpay, exceed tariff slabs, and miss simple cost-saving opportunities.
                    </p>
                </div>
                <div className="card-gradient rounded-xl border border-border p-6">
                    <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary inline-block" /> Description
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        VoltVision is an AI-powered web app that turns raw CSV energy data into actionable insights.
                        It forecasts usage, detects anomalies, calculates slab-based tariff costs, and intelligently schedules appliances —
                        all in a clean, real-time dashboard.
                    </p>
                </div>
            </div>

            {/* Objectives */}
            <div className="card-gradient rounded-xl border border-border p-6">
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Objectives
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {OBJECTIVES.map(o => (
                        <div key={o.title} className="rounded-lg border border-border bg-secondary/20 p-4 flex gap-3">
                            <div className="shrink-0 mt-0.5">{o.icon}</div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{o.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Expected Outcomes */}
            <div className="card-gradient rounded-xl border border-savings/20 p-6">
                <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-savings" /> Expected Outcomes
                </h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    {[
                        'Reduction in monthly electricity bills by identifying optimal appliance run times',
                        'Awareness of tariff slab progression before crossing into a higher-cost bracket',
                        'Early anomaly detection preventing unnoticed energy waste',
                        '24-hour usage forecasts empowering smarter daily energy decisions',
                        'An accessible, open-source tool available to any household with a smart meter',
                    ].map(item => (
                        <li key={item} className="flex gap-2 items-start">
                            <span className="h-1.5 w-1.5 rounded-full bg-savings mt-2 shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            {/* How to Use */}
            <div className="card-gradient rounded-xl border border-border p-6">
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" /> How to Use
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {HOW_TO_USE.map(h => (
                        <div key={h.step} className="rounded-lg border border-border bg-secondary/20 p-4 flex gap-3 items-start">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full energy-gradient text-xs font-bold text-primary-foreground">
                                {h.step}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                    {h.icon} {h.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">{h.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Team */}
            <div className="card-gradient rounded-xl border border-border p-6">
                <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> Team Axios
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {TEAM.map((member, i) => (
                        <div key={member.name} className="rounded-lg border border-border bg-secondary/20 p-3 text-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full energy-gradient mx-auto mb-2 text-sm font-bold text-primary-foreground">
                                {member.name.charAt(0)}
                            </div>
                            <p className="text-xs font-semibold text-foreground leading-tight">{member.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{member.role}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pb-4">
                <Link
                    to="/"
                    className="flex items-center justify-center gap-2 rounded-lg energy-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all"
                >
                    <Zap className="h-4 w-4" /> Open Dashboard
                </Link>
                <Link
                    to="/contact"
                    className="flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/50 px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                    <Mail className="h-4 w-4" /> Contact Team
                </Link>
            </div>
        </main>
    </div>
);

export default About;
