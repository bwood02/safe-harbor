// Typed API client for the .NET backend.
//
// Each page hook calls apiGet<T>(path). On any failure (network, 4xx, 5xx)
// it returns { data: null, error } so callers can fall back to a local mock
// without throwing. The dev convention is: hooks export both a real fetcher
// and a mock fallback object so pages always render even if the backend is
// down or the connection string isn't configured.

const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:5176';

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
}

export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status} ${res.statusText}` };
    }
    const data = (await res.json()) as T;
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { data: null, error: message };
  }
}

export { API_BASE_URL };
