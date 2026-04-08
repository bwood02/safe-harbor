import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ---- Types ----

export interface AdminKpis {
  activeResidents: number;
  recentDonationsAmount: number;
  upcomingReviews: number;
  avgProgress: number;
}

export interface AdminSafehouse {
  safehouseId: number;
  name: string;
  status: string;
  occupied: number;
  capacity: number;
  pct: number;
}

export interface WeeklyActivityDay {
  day: string;
  date: string;
  processRecordings: number;
  homeVisitations: number;
  donations: number;
  total: number;
}

export interface RecentActivityItem {
  title: string;
  meta: string;
  kind: string;
  timestamp: string;
}

export interface UpcomingReview {
  planId: number;
  residentId: number;
  residentCode: string;
  planCategory: string;
  caseConferenceDate: string;
}

// ---- Mock fallbacks ----

const MOCK_KPIS: AdminKpis = {
  activeResidents: 86,
  recentDonationsAmount: 18450,
  upcomingReviews: 12,
  avgProgress: 74,
};

const MOCK_SAFEHOUSES: AdminSafehouse[] = [
  { safehouseId: 1, name: 'Cebu Haven', status: 'ACTIVE', occupied: 14, capacity: 16, pct: 88 },
  { safehouseId: 2, name: 'Davao Shelter', status: 'ACTIVE', occupied: 11, capacity: 14, pct: 79 },
  { safehouseId: 3, name: 'Manila Harbor House', status: 'ACTIVE', occupied: 20, capacity: 20, pct: 100 },
  { safehouseId: 4, name: 'Iloilo Safe Home', status: 'ACTIVE', occupied: 9, capacity: 12, pct: 75 },
];

const MOCK_WEEKLY: WeeklyActivityDay[] = (() => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = [6, 9, 4, 11, 8, 3, 7];
  return days.map((day, i) => ({
    day,
    date: `2026-04-${(i + 1).toString().padStart(2, '0')}`,
    processRecordings: Math.max(0, values[i] - 2),
    homeVisitations: 1,
    donations: 1,
    total: values[i],
  }));
})();

const MOCK_RECENT: RecentActivityItem[] = [
  { title: 'Donation received: Monetary', meta: '$1,200 • Spring Campaign', kind: 'donation', timestamp: '2026-04-07T09:30:00Z' },
  { title: 'Session logged: Individual counseling', meta: 'M. Reyes • Resident #23041', kind: 'recording', timestamp: '2026-04-07T08:15:00Z' },
  { title: 'Home visit: Reintegration follow-up', meta: 'J. Santos • Cebu City', kind: 'visit', timestamp: '2026-04-06T15:40:00Z' },
  { title: 'Donation received: In-kind', meta: '$640 • School supplies', kind: 'donation', timestamp: '2026-04-06T12:10:00Z' },
  { title: 'Session logged: Group therapy', meta: 'K. Villanueva • Resident #23077', kind: 'recording', timestamp: '2026-04-05T14:00:00Z' },
  { title: 'Home visit: Family assessment', meta: 'A. Dela Cruz • Davao', kind: 'visit', timestamp: '2026-04-05T10:20:00Z' },
  { title: 'Donation received: Recurring', meta: '$250 • Monthly giving', kind: 'donation', timestamp: '2026-04-04T16:45:00Z' },
  { title: 'Session logged: Case review', meta: 'M. Reyes • Resident #23066', kind: 'recording', timestamp: '2026-04-04T11:05:00Z' },
];

const MOCK_UPCOMING: UpcomingReview[] = [
  { planId: 1, residentId: 23041, residentCode: 'SH-23041', planCategory: 'Reintegration', caseConferenceDate: '2026-04-09' },
  { planId: 2, residentId: 23058, residentCode: 'SH-23058', planCategory: 'Education', caseConferenceDate: '2026-04-10' },
  { planId: 3, residentId: 23066, residentCode: 'SH-23066', planCategory: 'Health & Wellbeing', caseConferenceDate: '2026-04-11' },
  { planId: 4, residentId: 23077, residentCode: 'SH-23077', planCategory: 'Protective Custody', caseConferenceDate: '2026-04-12' },
  { planId: 5, residentId: 23082, residentCode: 'SH-23082', planCategory: 'Reintegration', caseConferenceDate: '2026-04-13' },
];

// ---- Generic fetching hook ----

function useApiWithFallback<T>(path: string, fallback: T): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
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
  }, [path]);

  return state;
}

// ---- Exported hooks ----

export function useAdminKpis() {
  return useApiWithFallback<AdminKpis>('/api/AdminDashboard/kpis', MOCK_KPIS);
}

export function useAdminSafehouses() {
  return useApiWithFallback<AdminSafehouse[]>('/api/AdminDashboard/safehouses', MOCK_SAFEHOUSES);
}

export function useWeeklyActivity() {
  return useApiWithFallback<WeeklyActivityDay[]>('/api/AdminDashboard/weekly-activity', MOCK_WEEKLY);
}

export function useRecentActivity() {
  return useApiWithFallback<RecentActivityItem[]>('/api/AdminDashboard/recent-activity', MOCK_RECENT);
}

export function useUpcomingReviews() {
  return useApiWithFallback<UpcomingReview[]>('/api/AdminDashboard/upcoming-reviews', MOCK_UPCOMING);
}
