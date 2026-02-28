import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, BarChart3, Home, Factory, LogOut, LogIn } from 'lucide-react';
import UsageChart from '@/components/UsageChart';
import PeakSummary from '@/components/PeakSummary';
import CostCard from '@/components/CostCard';
import ApplianceForm from '@/components/ApplianceForm';
import RecommendationCard from '@/components/RecommendationCard';
import SavingsSummary from '@/components/SavingsSummary';
import GridStressCard from '@/components/GridStressCard';
import EnergyChatbot from '@/components/EnergyChatbot';
import DataUpload from '@/components/DataUpload';
import AnomalyChart from '@/components/AnomalyChart';
import SmartRecommendations from '@/components/SmartRecommendations';
import { api, type DashboardSummary } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadSummary = useCallback(() => {
    api.getDashboardSummary().then(setSummary);
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary, refreshKey]);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg energy-gradient">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">VoltVision</h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">AI Energy Optimizer</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5">
              <Home className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">Home</span>
              <span className="text-muted-foreground">/</span>
              <Factory className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Industrial</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-savings/10 border border-savings/20 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-savings animate-pulse-glow" />
              <span className="text-xs font-medium text-savings">Live</span>
            </div>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-[120px]">{user?.email}</span>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <main className="container mx-auto px-4 py-6">
        {/* Data Upload Section */}
        <div className="mb-6">
          <DataUpload onUploadSuccess={handleUploadSuccess} />
        </div>

        {/* Top Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Today's Usage"
            value={summary ? `${summary.totalDailyUsage.toFixed(1)} kWh` : '...'}
            icon={<BarChart3 className="h-4 w-4" />}
            variant="blue"
          />
          <StatCard
            label="Monthly Bill"
            value={summary ? `₹${Math.round(summary.monthlyCost).toLocaleString()}` : '...'}
            icon={<Zap className="h-4 w-4" />}
            variant="blue"
            highlight
          />
          <StatCard
            label="Peak Load"
            value={summary ? `${summary.peakLoad.toFixed(1)} kWh` : '...'}
            icon={<Zap className="h-4 w-4" />}
            variant="red"
          />
          <StatCard
            label="Savings"
            value={summary ? `₹${Math.round(summary.monthlySavings).toLocaleString()}` : '...'}
            icon={<Zap className="h-4 w-4" />}
            variant="green"
          />
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column – Analytics */}
          <div className="space-y-6">
            <UsageChart key={`chart-${refreshKey}`} />
            <AnomalyChart key={`anom-${refreshKey}`} mode="historical" />
            <AnomalyChart key={`anom-f-${refreshKey}`} mode="forecast" />
            <PeakSummary key={`peak-${refreshKey}`} />
            <GridStressCard key={`grid-${refreshKey}`} />
          </div>

          {/* Right Column – Optimization */}
          <div className="space-y-6">
            <SmartRecommendations key={`smart-${refreshKey}`} />
            <CostCard key={`cost-${refreshKey}`} />
            <ApplianceForm key={`form-${refreshKey}`} />
            <SavingsSummary key={`sav-${refreshKey}`} />
          </div>
        </div>
      </main>

      {/* Chatbot */}
      <EnergyChatbot />
    </div>
  );
};

const StatCard = ({ label, value, icon, variant, highlight }: { label: string; value: string; icon: React.ReactNode; variant: 'blue' | 'red' | 'green'; highlight?: boolean }) => {
  const styles = {
    blue: 'text-primary',
    red: 'text-peak',
    green: 'text-savings',
  };

  return (
    <div className={`card-gradient rounded-xl border ${highlight ? 'border-primary/30 glow-blue' : 'border-border'} p-4`}>
      <div className={`mb-1 ${styles[variant]}`}>{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold font-mono ${styles[variant]}`}>{value}</p>
    </div>
  );
};

export default Index;
