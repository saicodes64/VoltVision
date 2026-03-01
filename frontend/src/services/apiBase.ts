/**
 * Returns the absolute base URL for API calls.
 * In production, set VITE_API_BASE_URL in Render environment variables.
 * In local dev leave it empty — Vite proxy handles /api → localhost:8000.
 */
export function getApiBase(): string {
    return (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
}

/** Shorthand: getApiBase() + '/api' + path */
export function apiUrl(path: string): string {
    return `${getApiBase()}/api${path}`;
}

/** Auth headers from localStorage */
export function getAuthHeaders(): Record<string, string> {
    try {
        const raw = localStorage.getItem('vv_auth');
        const token = raw ? JSON.parse(raw)?.token : null;
        return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
        return {};
    }
}
