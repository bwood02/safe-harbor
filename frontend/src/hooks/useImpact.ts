import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export interface ImpactSummary {
  girlsSupported: number;
  safehouses: number;
  donors: number;
}

export interface OutcomeRow {
  label: string;
  pct: number;
}

export interface MonthlyDonationPoint {
  month: string;
  total: number;
}

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ImpactSummaryDto {
  girlsSupported: number;
  safehouses: number;
  donors: number;
  monthlyTrend: MonthlyDonationPoint[];
}

const mockSummary: ImpactSummary = {
  girlsSupported: 312,
  safehouses: 7,
  donors: 1284,
};

const mockOutcomes: OutcomeRow[] = [
  { label: 'Reintegrated', pct: 42 },
  { label: 'In Progress', pct: 31 },
  { label: 'At Risk', pct: 17 },
  { label: 'Active Stabilization', pct: 10 },
];

const mockTrend: MonthlyDonationPoint[] = [
  { month: '2025-05', total: 12400 },
  { month: '2025-06', total: 15800 },
  { month: '2025-07', total: 11200 },
  { month: '2025-08', total: 17600 },
  { month: '2025-09', total: 14300 },
  { month: '2025-10', total: 19850 },
  { month: '2025-11', total: 22100 },
  { month: '2025-12', total: 28900 },
  { month: '2026-01', total: 16450 },
  { month: '2026-02', total: 18700 },
  { month: '2026-03', total: 21300 },
  { month: '2026-04', total: 9450 },
];

function useFetch<TRaw, TOut>(
  path: string,
  fallback: TOut,
  map: (raw: TRaw) => TOut,
): QueryState<TOut> {
  const [state, setState] = useState<QueryState<TOut>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    apiGet<TRaw>(path).then((res) => {
      if (cancelled) return;
      if (res.data) {
        setState({ data: map(res.data), loading: false, error: null });
      } else {
        setState({ data: fallback, loading: false, error: res.error });
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return state;
}

export function useImpactSummary(): QueryState<ImpactSummary> {
  return useFetch<ImpactSummaryDto, ImpactSummary>(
    '/api/Impact/summary',
    mockSummary,
    (raw) => ({
      girlsSupported: raw.girlsSupported,
      safehouses: raw.safehouses,
      donors: raw.donors,
    }),
  );
}

export function useOutcomeDistribution(): QueryState<OutcomeRow[]> {
  return useFetch<OutcomeRow[], OutcomeRow[]>(
    '/api/Impact/outcomes',
    mockOutcomes,
    (raw) => raw,
  );
}

export function useMonthlyDonationTrend(): QueryState<MonthlyDonationPoint[]> {
  return useFetch<ImpactSummaryDto, MonthlyDonationPoint[]>(
    '/api/Impact/summary',
    mockTrend,
    (raw) => (raw.monthlyTrend && raw.monthlyTrend.length > 0 ? raw.monthlyTrend : mockTrend),
  );
}
