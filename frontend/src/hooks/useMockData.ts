import { useMemo } from 'react';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useStaticData<T>(value: T): QueryState<T> {
  const data = useMemo(() => value, [value]);
  return { data, loading: false, error: null };
}

// ---- Impact Dashboard ----

export interface ImpactSummary {
  girlsSupported: number;
  safehouses: number;
  donors: number;
}

export interface OutcomeRow {
  label: string;
  pct: number;
}

export function useImpactSummary() {
  return useStaticData<ImpactSummary>({
    girlsSupported: 312,
    safehouses: 7,
    donors: 1284,
  });
}

export function useOutcomeDistribution() {
  return useStaticData<OutcomeRow[]>([
    { label: 'Reintegrated', pct: 42 },
    { label: 'In Progress', pct: 31 },
    { label: 'At Risk', pct: 17 },
    { label: 'Active Stabilization', pct: 10 },
  ]);
}

// ---- Admin Dashboard ----

export interface KpiCards {
  activeResidents: number;
  recentDonationsAmount: number;
  upcomingReviews: number;
  avgProgress: number;
}

export interface SafehouseRow {
  name: string;
  status: string;
  occupied: number;
  capacity: number;
  pct: number;
}

export function useAdminKpis() {
  return useStaticData<KpiCards>({
    activeResidents: 86,
    recentDonationsAmount: 18450,
    upcomingReviews: 12,
    avgProgress: 74,
  });
}

export function useSafehouses() {
  return useStaticData<SafehouseRow[]>([
    { name: 'Cebu Haven', status: 'ACTIVE', occupied: 14, capacity: 16, pct: 88 },
    { name: 'Davao Shelter', status: 'ACTIVE', occupied: 11, capacity: 14, pct: 79 },
    { name: 'Manila Harbor House', status: 'ACTIVE', occupied: 20, capacity: 20, pct: 100 },
    { name: 'Iloilo Safe Home', status: 'ACTIVE', occupied: 9, capacity: 12, pct: 75 },
  ]);
}

// ---- Caseload ----

export type ResidentStatus = 'Active' | 'In Progress' | 'Reintegrated' | 'At Risk';

export interface ResidentRow {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  safehouse: string;
  socialWorker: string;
  status: ResidentStatus;
}

export function useResidents() {
  return useStaticData<ResidentRow[]>([
    {
      id: 'SH-23041',
      name: 'Resident A',
      category: 'Protective Custody',
      subCategory: 'Trafficked, At risk',
      safehouse: 'Cebu Haven',
      socialWorker: 'M. Reyes',
      status: 'In Progress',
    },
    {
      id: 'SH-23058',
      name: 'Resident B',
      category: 'Reintegration',
      subCategory: 'Sexual abuse',
      safehouse: 'Davao Shelter',
      socialWorker: 'J. Santos',
      status: 'Reintegrated',
    },
    {
      id: 'SH-23066',
      name: 'Resident C',
      category: 'Crisis Intake',
      subCategory: 'Street child',
      safehouse: 'Manila Harbor House',
      socialWorker: 'K. Villanueva',
      status: 'At Risk',
    },
    {
      id: 'SH-23077',
      name: 'Resident D',
      category: 'Protective Custody',
      subCategory: 'Physical abuse',
      safehouse: 'Iloilo Safe Home',
      socialWorker: 'A. Dela Cruz',
      status: 'Active',
    },
  ]);
}
