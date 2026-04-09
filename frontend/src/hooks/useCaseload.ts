import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost, apiPut, API_BASE_URL } from '@/lib/api';
import type {
  ResidentListItem,
  ResidentDetail,
  SafehouseOption,
  CaseloadFilters,
  CaseloadFilterOptions,
  ResidentInput,
  ResidentFull,
} from '@/types/caseload';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const EMPTY_FILTERS: CaseloadFilterOptions = {
  statuses: [],
  categories: [],
  riskLevels: [],
  socialWorkers: [],
};

function buildQuery(filters: CaseloadFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.safehouseId != null) params.set('safehouseId', String(filters.safehouseId));
  if (filters.category) params.set('category', filters.category);
  if (filters.riskLevel) params.set('riskLevel', filters.riskLevel);
  const s = params.toString();
  return s ? `?${s}` : '';
}

function useApi<T>(path: string | null, fallback: T): QueryState<T> {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (path == null) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    apiGet<T>(path).then((res) => {
      if (cancelled) return;
      if (res.data !== null) {
        setState({ data: res.data, loading: false, error: null });
      } else {
        setState({ data: fallback, loading: false, error: res.error });
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, version]);

  return { ...state, refetch: () => setVersion((v) => v + 1) };
}

export function useCaseloadList(filters: CaseloadFilters) {
  const path = `/api/CaseloadInventory/residents${buildQuery(filters)}`;
  return useApi<ResidentListItem[]>(path, []);
}

export function useCaseloadDetail(id: number | null) {
  const path = id != null ? `/api/CaseloadInventory/residents/${id}` : null;
  return useApi<ResidentDetail | null>(path, null);
}

export function useSafehouses() {
  return useApi<SafehouseOption[]>('/api/CaseloadInventory/safehouses', []);
}

export function useCaseloadFilters() {
  return useApi<CaseloadFilterOptions>('/api/CaseloadInventory/filters', EMPTY_FILTERS);
}

export function useCaseloadMutations() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (input: ResidentInput) => {
    setSaving(true);
    setError(null);
    const res = await apiPost<ResidentInput, ResidentFull>('/api/CaseloadInventory/residents', input);
    setSaving(false);
    if (res.error) setError(res.error);
    return res;
  }, []);

  const update = useCallback(async (id: number, input: ResidentInput) => {
    setSaving(true);
    setError(null);
    const res = await apiPut<ResidentInput, ResidentFull>(`/api/CaseloadInventory/residents/${id}`, input);
    setSaving(false);
    if (res.error) setError(res.error);
    return res;
  }, []);

  const softDelete = useCallback(async (id: number) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/CaseloadInventory/residents/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      setSaving(false);
      if (!res.ok) {
        const msg = `HTTP ${res.status} ${res.statusText}`;
        setError(msg);
        return { data: null, error: msg };
      }
      const data = await res.json();
      return { data, error: null };
    } catch (err) {
      setSaving(false);
      const msg = err instanceof Error ? err.message : 'Network error';
      setError(msg);
      return { data: null, error: msg };
    }
  }, []);

  return { create, update, softDelete, saving, error };
}
