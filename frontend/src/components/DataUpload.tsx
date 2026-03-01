import { useState, useRef } from 'react';
import {
    Upload, FileUp, CheckCircle2, AlertCircle, Loader2,
    X, RefreshCw, Download, Trash2
} from 'lucide-react';

interface UploadResult {
    message: string;
    rows_processed: number;
    date_range?: string;
}

function getAuthHeaders(): Record<string, string> {
    try {
        const raw = localStorage.getItem('vv_auth');
        const token = raw ? JSON.parse(raw)?.token : null;
        return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
        return {};
    }
}

const DataUpload = ({ onUploadSuccess }: { onUploadSuccess: () => void }) => {
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(true);
    const [clearConfirm, setClearConfirm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Upload ──────────────────────────────────────────
    const handleFile = async (file: File) => {
        if (!file.name.endsWith('.csv')) {
            setError('Only CSV files are accepted. Please upload a .csv file.');
            return;
        }
        setUploading(true);
        setError(null);
        setResult(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload-data', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData,
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.detail || `Upload failed: ${res.status}`);
            }
            const data: UploadResult = await res.json();
            setResult(data);
            setExpanded(false);
            onUploadSuccess();
        } catch (err: any) {
            setError(err.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    // ── Clear all data ───────────────────────────────────
    const handleClear = async () => {
        if (!clearConfirm) {
            setClearConfirm(true);
            return;
        }
        setClearing(true);
        setClearConfirm(false);
        try {
            const res = await fetch('/api/clear-data', {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.detail || 'Clear failed');
            }
            setResult(null);
            setError(null);
            setExpanded(true);
            if (fileInputRef.current) fileInputRef.current.value = '';
            onUploadSuccess(); // Refresh dashboard (shows empty state)
        } catch (err: any) {
            setError(err.message || 'Failed to clear data');
        } finally {
            setClearing(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const reset = () => {
        setResult(null);
        setError(null);
        setExpanded(true);
        setClearConfirm(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const downloadSampleCSV = () => {
        const now = new Date();
        const rows = ['timestamp,usage_kwh'];
        for (let i = 167; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 3600000);
            const hour = d.getHours();
            const pattern = [
                0.4, 0.3, 0.25, 0.2, 0.25, 0.4,
                0.8, 1.5, 1.8, 1.6, 1.4, 1.3,
                1.2, 1.0, 1.1, 1.3, 1.8, 2.5,
                3.2, 3.5, 2.8, 2.0, 1.2, 0.7,
            ];
            const base = pattern[hour];
            const noise = (Math.random() - 0.5) * 0.2;
            const usage = Math.max(0.1, base + noise).toFixed(2);
            const ts = d.toISOString().slice(0, 19).replace('T', ' ');
            rows.push(`${ts},${usage}`);
        }
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_energy_data.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // ─── Collapsed State (after successful upload) ────────────────
    if (result && !expanded) {
        return (
            <div className="rounded-xl border border-savings/30 bg-savings/5 px-4 py-3 flex items-center justify-between animate-slide-up">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-savings shrink-0" />
                    <div>
                        <span className="text-sm font-medium text-savings">
                            Data loaded — {result.rows_processed.toLocaleString()} records
                        </span>
                        {result.date_range && (
                            <span className="text-xs text-muted-foreground ml-2">({result.date_range})</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={reset}
                        className="flex items-center gap-1.5 rounded-lg bg-secondary/50 hover:bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <RefreshCw className="h-3 w-3" /> Upload New
                    </button>
                    {clearConfirm ? (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-peak">Sure?</span>
                            <button
                                onClick={handleClear}
                                disabled={clearing}
                                className="rounded-lg bg-peak/10 hover:bg-peak/20 border border-peak/30 px-2 py-1 text-xs text-peak font-semibold transition-colors"
                            >
                                {clearing ? 'Clearing...' : 'Yes, Clear'}
                            </button>
                            <button
                                onClick={() => setClearConfirm(false)}
                                className="rounded-lg bg-secondary/50 hover:bg-secondary px-2 py-1 text-xs text-muted-foreground transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleClear}
                            className="flex items-center gap-1.5 rounded-lg bg-peak/5 hover:bg-peak/10 border border-peak/20 px-3 py-1.5 text-xs text-peak hover:text-peak transition-colors"
                        >
                            <Trash2 className="h-3 w-3" /> Clear Data
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ─── Full Upload Panel ─────────────────────────────────────────
    return (
        <div className="card-gradient rounded-xl border border-border p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg energy-gradient">
                        <Upload className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Upload Energy Data</h2>
                        <p className="text-xs text-muted-foreground">Uploading a new file replaces previous data</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Clear data standalone button when no result loaded yet */}
                    {clearConfirm ? (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-peak">Are you sure?</span>
                            <button
                                onClick={handleClear}
                                disabled={clearing}
                                className="rounded-lg bg-peak/10 hover:bg-peak/20 border border-peak/30 px-2 py-1.5 text-xs text-peak font-semibold transition-colors"
                            >
                                {clearing ? 'Clearing...' : 'Yes, clear all'}
                            </button>
                            <button
                                onClick={() => setClearConfirm(false)}
                                className="rounded-lg bg-secondary/50 hover:bg-secondary px-2 py-1.5 text-xs text-muted-foreground transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleClear}
                            disabled={clearing}
                            className="flex items-center gap-1.5 rounded-lg border border-peak/20 bg-peak/5 px-3 py-1.5 text-xs text-peak hover:bg-peak/10 transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            {clearing ? 'Clearing...' : 'Clear Data'}
                        </button>
                    )}
                    <button
                        onClick={downloadSampleCSV}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                    >
                        <Download className="h-3.5 w-3.5" /> Sample CSV
                    </button>
                </div>
            </div>

            {/* Drop Zone */}
            {!uploading && !error && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 py-6 text-center ${dragging
                        ? 'border-primary bg-primary/5 scale-[1.01]'
                        : 'border-border hover:border-primary/40 hover:bg-secondary/20'
                        }`}
                >
                    <input ref={fileInputRef} type="file" accept=".csv" onChange={handleInputChange} className="hidden" />
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                            <FileUp className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            {dragging ? 'Drop your CSV here' : 'Click or drag a CSV file'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Columns: <code className="bg-muted/50 rounded px-1">timestamp</code> + <code className="bg-muted/50 rounded px-1">usage_kwh</code>
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            ⚠ Uploading replaces all existing session data
                        </p>
                    </div>
                </div>
            )}

            {/* Uploading */}
            {uploading && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 py-6 flex flex-col items-center gap-3 animate-pulse">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm font-medium text-foreground">Processing data...</p>
                    <p className="text-xs text-muted-foreground">Clearing old data and loading your new dataset</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="rounded-xl border border-peak/20 bg-peak/5 p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-peak mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-peak">Failed</p>
                            <p className="text-xs text-muted-foreground mt-1">{error}</p>
                        </div>
                        <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <button
                        onClick={reset}
                        className="mt-3 w-full rounded-lg bg-secondary/50 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default DataUpload;
