import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { apiUrl } from '@/services/apiBase';

const Contact = () => {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(p => ({ ...p, [field]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(apiUrl('/contact'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to send message');
            setSuccess(true);
            setForm({ name: '', email: '', subject: '', message: '' });
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        'w-full rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all';

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="container mx-auto px-4 py-3 flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm">Back</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg energy-gradient">
                            <Mail className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">Contact Us</span>
                    </div>
                    <nav className="ml-auto flex gap-4">
                        <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
                        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto px-4 py-10 max-w-lg">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-2">Get in Touch</h1>
                    <p className="text-muted-foreground text-sm">
                        Have questions about VoltVision? We'd love to hear from you.
                    </p>
                </div>

                <div className="card-gradient rounded-xl border border-border p-6">
                    {success ? (
                        <div className="flex flex-col items-center gap-4 py-6 text-center animate-slide-up">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-savings/10">
                                <CheckCircle2 className="h-7 w-7 text-savings" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-foreground">Message Sent!</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Thank you for reaching out. We'll get back to you soon.
                                </p>
                            </div>
                            <button
                                onClick={() => setSuccess(false)}
                                className="text-xs text-primary hover:underline"
                            >
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                                    <input className={inputClass} placeholder="Your name" value={form.name} onChange={set('name')} required />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                                    <input className={inputClass} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
                                <input className={inputClass} placeholder="What's this about?" value={form.subject} onChange={set('subject')} required />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
                                <textarea
                                    className={`${inputClass} min-h-[130px] resize-none`}
                                    placeholder="Your message..."
                                    value={form.message}
                                    onChange={set('message')}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="rounded-lg border border-peak/20 bg-peak/5 p-3 flex items-center gap-2 text-xs text-peak">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-lg energy-gradient py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Send Message</>}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Contact;
