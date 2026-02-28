import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';

export default function Signup() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const data = await api.auth.signup(email, password);
            login(data);
            navigate('/');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center gap-3 justify-center mb-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl energy-gradient shadow-lg">
                        <Zap className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">VoltVision</h1>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">AI Energy Optimizer</p>
                    </div>
                </div>

                {/* Card */}
                <div className="card-gradient rounded-2xl border border-border p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-foreground mb-1">Create your account</h2>
                    <p className="text-sm text-muted-foreground mb-6">Start optimising your energy usage today</p>

                    {error && (
                        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                            <input
                                id="signup-email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full rounded-lg border border-border bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                            <div className="relative">
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Min. 8 characters"
                                    className="w-full rounded-lg border border-border bg-secondary/40 px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
                            <input
                                id="signup-confirm"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                placeholder="Re-enter password"
                                className="w-full rounded-lg border border-border bg-secondary/40 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-all"
                            />
                        </div>

                        <button
                            id="signup-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg energy-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
