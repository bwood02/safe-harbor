// Typed API client for the .NET backend.
//
// Each page hook calls apiGet<T>(path). On any failure (network, 4xx, 5xx)
// it returns { data: null, error } so callers can fall back to a local mock
// without throwing. The dev convention is: hooks export both a real fetcher
// and a mock fallback object so pages always render even if the backend is
// down or the connection string isn't configured.

function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (raw !== undefined && String(raw).trim() !== '') {
    return String(raw).trim().replace(/\/$/, '');
  }
  // Dev: relative /api so Vite proxies to the backend (see vite.config.ts). No CORS; works with `dotnet run` http profile.
  if (import.meta.env.DEV) {
    return '';
  }
  return 'http://localhost:5176';
}

const API_BASE_URL: string = resolveApiBaseUrl();

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
      let errorDetail = `HTTP ${res.status} ${res.statusText}`;
      try {
        const body = await res.json();
        if (typeof body === 'string') errorDetail = body;
        else if (body?.error) errorDetail = String(body.error);
        else if (body?.detail) errorDetail = String(body.detail);
      } catch {
        // ignore parse issues and keep status text fallback
      }
      return { data: null, error: errorDetail };
    }
    const data = (await res.json()) as T;
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { data: null, error: message };
  }
}

export async function apiPost<TRequest, TResponse>(
  path: string,
  body: TRequest,
): Promise<ApiResult<TResponse>> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let errorDetail = `HTTP ${res.status} ${res.statusText}`;
      try {
        const body = await res.json();
        if (typeof body === 'string') errorDetail = body;
        else if (body?.error) errorDetail = String(body.error);
        else if (body?.detail) errorDetail = String(body.detail);
      } catch {
        // ignore parse issues and keep status text fallback
      }
      return { data: null, error: errorDetail };
    }
    const data = (await res.json()) as TResponse;
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { data: null, error: message };
  }
}

export async function apiPut<TRequest, TResponse>(
  path: string,
  body: TRequest,
): Promise<ApiResult<TResponse>> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let errorDetail = `HTTP ${res.status} ${res.statusText}`;
      try {
        const body = await res.json();
        if (typeof body === 'string') errorDetail = body;
        else if (body?.error) errorDetail = String(body.error);
        else if (body?.detail) errorDetail = String(body.detail);
      } catch {
        // ignore parse issues and keep status text fallback
      }
      return { data: null, error: errorDetail };
    }
    const data = (await res.json()) as TResponse;
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { data: null, error: message };
  }
}

export { API_BASE_URL };
