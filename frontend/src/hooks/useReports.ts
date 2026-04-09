import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import type {
  AnnualAccomplishment,
  ApiEnvelope,
  DonationByCampaign,
  DonationByType,
  DonationTrendPoint,
  ReintegrationOutcomes,
  ReportsDateRange,
  ResidentOutcomePoint,
  SafehouseComparisonRow,
} from '@/types/reports';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ---- Mocks ----

const MOCK_TRENDS: DonationTrendPoint[] = [
  { period: '2025-05', donationCount: 22, totalPhp: 184000 },
  { period: '2025-06', donationCount: 31, totalPhp: 236500 },
  { period: '2025-07', donationCount: 27, totalPhp: 198200 },
  { period: '2025-08', donationCount: 34, totalPhp: 271000 },
  { period: '2025-09', donationCount: 28, totalPhp: 212400 },
  { period: '2025-10', donationCount: 41, totalPhp: 318900 },
  { period: '2025-11', donationCount: 38, totalPhp: 294600 },
  { period: '2025-12', donationCount: 55, totalPhp: 452700 },
  { period: '2026-01', donationCount: 29, totalPhp: 221800 },
  { period: '2026-02', donationCount: 33, totalPhp: 258300 },
  { period: '2026-03', donationCount: 36, totalPhp: 279100 },
  { period: '2026-04', donationCount: 18, totalPhp: 142500 },
];

const MOCK_CAMPAIGNS: DonationByCampaign[] = [
  { campaignName: 'Year-End Appeal', totalPhp: 612400, donorCount: 38 },
  { campaignName: 'Back-to-School', totalPhp: 384100, donorCount: 27 },
  { campaignName: 'Spring Campaign', totalPhp: 298600, donorCount: 31 },
  { campaignName: 'Emergency Fund', totalPhp: 178900, donorCount: 14 },
  { campaignName: '(Uncategorized)', totalPhp: 96300, donorCount: 22 },
];

const MOCK_TYPES: DonationByType[] = [
  { donationType: 'Monetary', totalPhp: 1240000, count: 182 },
  { donationType: 'InKind', totalPhp: 318900, count: 47 },
  { donationType: 'Time', totalPhp: 92000, count: 31 },
  { donationType: 'Skills', totalPhp: 64500, count: 18 },
];

const MOCK_OUTCOMES: ResidentOutcomePoint[] = [
  { period: '2025-10', avgEducationProgress: 68, avgHealthScore: 3.9, activeResidentCount: 54 },
  { period: '2025-11', avgEducationProgress: 70, avgHealthScore: 3.95, activeResidentCount: 54 },
  { period: '2025-12', avgEducationProgress: 71, avgHealthScore: 4.0, activeResidentCount: 56 },
  { period: '2026-01', avgEducationProgress: 72, avgHealthScore: 4.05, activeResidentCount: 56 },
  { period: '2026-02', avgEducationProgress: 73, avgHealthScore: 4.1, activeResidentCount: 57 },
  { period: '2026-03', avgEducationProgress: 74, avgHealthScore: 4.12, activeResidentCount: 57 },
];

const MOCK_SAFEHOUSES: SafehouseComparisonRow[] = [
  { safehouseId: 1, safehouseName: 'Cebu Haven', activeResidents: 14, avgEducationProgress: 74, avgHealthScore: 4.25, incidentCount: 0, processRecordingCount: 42, homeVisitCount: 11 },
  { safehouseId: 2, safehouseName: 'Davao Shelter', activeResidents: 11, avgEducationProgress: 70, avgHealthScore: 3.94, incidentCount: 2, processRecordingCount: 33, homeVisitCount: 8 },
  { safehouseId: 3, safehouseName: 'Manila Harbor House', activeResidents: 20, avgEducationProgress: 78, avgHealthScore: 4.33, incidentCount: 0, processRecordingCount: 58, homeVisitCount: 15 },
  { safehouseId: 4, safehouseName: 'Iloilo Safe Home', activeResidents: 9, avgEducationProgress: 73, avgHealthScore: 4.05, incidentCount: 1, processRecordingCount: 27, homeVisitCount: 7 },
];

const MOCK_REINTEGRATION: ReintegrationOutcomes = {
  statusBreakdown: [
    { key: 'In Progress', count: 28 },
    { key: 'Completed', count: 19 },
    { key: 'Not Started', count: 11 },
    { key: 'On Hold', count: 4 },
  ],
  typeBreakdown: [
    { key: 'Family Reunification', count: 24 },
    { key: 'Foster Care', count: 14 },
    { key: 'Independent Living', count: 12 },
    { key: 'Adoption Domestic', count: 8 },
    { key: 'Adoption Inter-Country', count: 4 },
  ],
  completionRatePercent: 30.65,
};

const MOCK_ANNUAL: AnnualAccomplishment = {
  year: 2025,
  servicesProvided: { caring: 142, healing: 98, teaching: 121 },
  beneficiaries: { totalServed: 87, activeAtYearEnd: 54 },
  outcomes: { reintegrationsCompleted: 19, educationCompletions: 32, avgHealthImprovement: 0.42 },
};

// ---- Generic hook ----

function useEnvelope<T>(path: string, fallback: T, deps: ReadonlyArray<unknown>): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    apiGet<ApiEnvelope<T>>(path).then((res) => {
      if (cancelled) return;
      if (res.data && res.data.data !== null && res.data.data !== undefined) {
        setState({ data: res.data.data, loading: false, error: null });
      } else {
        setState({
          data: fallback,
          loading: false,
          error: res.error ?? res.data?.error ?? 'No data',
        });
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

function buildQuery(range: ReportsDateRange, extra?: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  if (range.fromDate) params.set('fromDate', range.fromDate);
  if (range.toDate) params.set('toDate', range.toDate);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

// ---- Exported hooks ----

export function useDonationTrends(range: ReportsDateRange, groupBy: 'month' | 'quarter' = 'month') {
  const qs = buildQuery(range, { groupBy });
  return useEnvelope<DonationTrendPoint[]>(
    `/api/Reports/donation-trends${qs}`,
    MOCK_TRENDS,
    [range.fromDate, range.toDate, groupBy],
  );
}

export function useDonationsByCampaign(range: ReportsDateRange) {
  const qs = buildQuery(range);
  return useEnvelope<DonationByCampaign[]>(
    `/api/Reports/donations-by-campaign${qs}`,
    MOCK_CAMPAIGNS,
    [range.fromDate, range.toDate],
  );
}

export function useDonationsByType(range: ReportsDateRange) {
  const qs = buildQuery(range);
  return useEnvelope<DonationByType[]>(
    `/api/Reports/donations-by-type${qs}`,
    MOCK_TYPES,
    [range.fromDate, range.toDate],
  );
}

export function useResidentOutcomes(range: ReportsDateRange) {
  const qs = buildQuery(range);
  return useEnvelope<ResidentOutcomePoint[]>(
    `/api/Reports/resident-outcomes${qs}`,
    MOCK_OUTCOMES,
    [range.fromDate, range.toDate],
  );
}

export function useSafehouseComparison(range: ReportsDateRange) {
  const qs = buildQuery(range);
  return useEnvelope<SafehouseComparisonRow[]>(
    `/api/Reports/safehouse-comparison${qs}`,
    MOCK_SAFEHOUSES,
    [range.fromDate, range.toDate],
  );
}

export function useReintegrationOutcomes() {
  return useEnvelope<ReintegrationOutcomes>(
    '/api/Reports/reintegration-outcomes',
    MOCK_REINTEGRATION,
    [],
  );
}

export function useAnnualAccomplishment(year: number | null) {
  const qs = year ? `?year=${year}` : '';
  return useEnvelope<AnnualAccomplishment>(
    `/api/Reports/annual-accomplishment${qs}`,
    MOCK_ANNUAL,
    [year],
  );
}
