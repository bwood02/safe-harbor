import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export interface SupporterListItem {
  supporterId: number;
  displayName: string;
  supporterType: string;
  relationshipType: string;
  region: string;
  country: string;
  email: string;
  status: string;
  firstDonationDate: string | null;
  totalGiven: number;
  donationCount: number;
}

export interface SupportersPage {
  items: SupporterListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SupporterDetail {
  supporterId: number;
  supporterType: string;
  displayName: string;
  organizationName: string | null;
  firstName: string | null;
  lastName: string | null;
  relationshipType: string;
  region: string;
  country: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  firstDonationDate: string | null;
  acquisitionChannel: string;
}

export interface DonationRecord {
  donationId: number;
  supporterId: number;
  donationType: string;
  donationDate: string | null;
  isRecurring: boolean;
  campaignName: string | null;
  channelSource: string | null;
  currencyCode: string | null;
  amount: number | null;
  estimatedValue: number;
  impactUnit: string;
  notes: string | null;
  /** Present when loaded from CreateDonation response or enriched detail. */
  allocationSummary?: string | null;
}

export interface RecentDonation {
  donationId: number;
  supporterId: number;
  supporterName: string;
  donationType: string;
  donationDate: string | null;
  estimatedValue: number;
  campaignName: string | null;
  currencyCode: string | null;
}

export interface ProgramAreaTotal {
  programArea: string;
  total: number;
  count: number;
}

export interface SupporterFilters {
  page?: number;
  pageSize?: number;
  type?: string;
  status?: string;
  search?: string;
  /** Increment to refetch list after server mutations (e.g. donations). */
  refreshToken?: number;
}

// ---- Mock fallbacks ----

const MOCK_SUPPORTERS: SupporterListItem[] = [
  { supporterId: 1, displayName: 'Acme Foundation', supporterType: 'Organization', relationshipType: 'Grant', region: 'Luzon', country: 'Philippines', email: 'grants@acme.org', status: 'Active', firstDonationDate: '2024-02-11', totalGiven: 48200, donationCount: 6 },
  { supporterId: 2, displayName: 'Maria Santos', supporterType: 'Individual', relationshipType: 'Monthly Donor', region: 'Visayas', country: 'Philippines', email: 'maria@example.com', status: 'Active', firstDonationDate: '2023-08-04', totalGiven: 3640, donationCount: 22 },
  { supporterId: 3, displayName: 'Nakamura Kenji', supporterType: 'Individual', relationshipType: 'Major Donor', region: 'Kanto', country: 'Japan', email: 'kenji.n@example.jp', status: 'Active', firstDonationDate: '2022-11-19', totalGiven: 22100, donationCount: 4 },
  { supporterId: 4, displayName: 'Harbor Light Church', supporterType: 'Organization', relationshipType: 'Partner', region: 'Mindanao', country: 'Philippines', email: 'office@harborlight.ph', status: 'Active', firstDonationDate: '2023-01-15', totalGiven: 15880, donationCount: 12 },
  { supporterId: 5, displayName: 'Elena Ramos', supporterType: 'Individual', relationshipType: 'One-time', region: 'Luzon', country: 'Philippines', email: 'elena.r@example.com', status: 'Lapsed', firstDonationDate: '2023-05-22', totalGiven: 250, donationCount: 1 },
  { supporterId: 6, displayName: 'Global Hope Trust', supporterType: 'Organization', relationshipType: 'Grant', region: 'London', country: 'United Kingdom', email: 'trust@globalhope.uk', status: 'Active', firstDonationDate: '2024-01-09', totalGiven: 62000, donationCount: 3 },
  { supporterId: 7, displayName: 'James Patel', supporterType: 'Individual', relationshipType: 'Monthly Donor', region: 'California', country: 'United States', email: 'james.p@example.com', status: 'Active', firstDonationDate: '2023-03-30', totalGiven: 2880, donationCount: 24 },
  { supporterId: 8, displayName: 'Bayside Rotary Club', supporterType: 'Organization', relationshipType: 'Partner', region: 'Visayas', country: 'Philippines', email: 'rotary@bayside.ph', status: 'Active', firstDonationDate: '2022-06-10', totalGiven: 9420, donationCount: 9 },
];

const MOCK_DETAILS: Record<number, SupporterDetail> = Object.fromEntries(
  MOCK_SUPPORTERS.map((s) => [
    s.supporterId,
    {
      supporterId: s.supporterId,
      supporterType: s.supporterType,
      displayName: s.displayName,
      organizationName: s.supporterType === 'Organization' ? s.displayName : null,
      firstName: s.supporterType === 'Individual' ? s.displayName.split(' ')[0] : null,
      lastName: s.supporterType === 'Individual' ? s.displayName.split(' ').slice(1).join(' ') || null : null,
      relationshipType: s.relationshipType,
      region: s.region,
      country: s.country,
      email: s.email,
      phone: '+63-000-0000000',
      status: s.status,
      createdAt: '2023-01-01T00:00:00Z',
      firstDonationDate: s.firstDonationDate,
      acquisitionChannel: 'Referral',
    },
  ]),
);

function mockDonationsFor(supporterId: number): DonationRecord[] {
  const base = MOCK_SUPPORTERS.find((s) => s.supporterId === supporterId);
  if (!base) return [];
  const count = Math.min(base.donationCount, 6);
  const avg = base.donationCount > 0 ? base.totalGiven / base.donationCount : 0;
  return Array.from({ length: count }, (_, i) => ({
    donationId: supporterId * 100 + i,
    supporterId,
    donationType: i % 3 === 0 ? 'In-Kind' : 'Monetary',
    donationDate: `2025-${String(12 - i).padStart(2, '0')}-10`,
    isRecurring: base.relationshipType === 'Monthly Donor',
    campaignName: i % 2 === 0 ? 'Year-End Appeal' : null,
    channelSource: 'Website',
    currencyCode: 'USD',
    amount: avg,
    estimatedValue: avg,
    impactUnit: 'USD',
    notes: null,
  }));
}

const MOCK_RECENT: RecentDonation[] = MOCK_SUPPORTERS.flatMap((s, idx) =>
  Array.from({ length: 3 }, (_, i) => ({
    donationId: s.supporterId * 10 + i,
    supporterId: s.supporterId,
    supporterName: s.displayName,
    donationType: i % 2 === 0 ? 'Monetary' : 'In-Kind',
    donationDate: `2026-04-${String(1 + ((idx + i) % 6)).padStart(2, '0')}`,
    estimatedValue: Math.round(100 + (s.totalGiven / Math.max(s.donationCount, 1))),
    campaignName: idx % 2 === 0 ? 'Spring Drive' : null,
    currencyCode: 'USD',
  })),
);

const MOCK_PROGRAM_AREAS: ProgramAreaTotal[] = [
  { programArea: 'Education', total: 42800, count: 24 },
  { programArea: 'Counseling', total: 31200, count: 18 },
  { programArea: 'Housing', total: 28650, count: 12 },
  { programArea: 'Healthcare', total: 19400, count: 15 },
  { programArea: 'Reintegration', total: 12100, count: 9 },
];

// ---- Hooks ----

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useSupporters(filters: SupporterFilters = {}): QueryState<SupportersPage> {
  const { page = 1, pageSize = 50, type, status, search, refreshToken = 0 } = filters;
  const [state, setState] = useState<QueryState<SupportersPage>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    if (search) params.set('search', search);

    setState((s) => ({ ...s, loading: true }));
    apiGet<SupportersPage>(`/api/Supporters?${params.toString()}`).then((res) => {
      if (cancelled) return;
      if (res.data) {
        setState({ data: res.data, loading: false, error: null });
      } else {
        // Mock fallback with client-side filtering
        let items = MOCK_SUPPORTERS;
        if (type) items = items.filter((s) => s.supporterType === type);
        if (status) items = items.filter((s) => s.status === status);
        if (search) {
          const term = search.toLowerCase();
          items = items.filter(
            (s) =>
              s.displayName.toLowerCase().includes(term) ||
              s.email.toLowerCase().includes(term),
          );
        }
        const total = items.length;
        const start = (page - 1) * pageSize;
        const paged = items.slice(start, start + pageSize);
        setState({
          data: { items: paged, total, page, pageSize },
          loading: false,
          error: res.error,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, type, status, search, refreshToken]);

  return state;
}

export function useSupporterDetail(
  id: number | null,
  refreshToken = 0,
): QueryState<{
  supporter: SupporterDetail;
  donations: DonationRecord[];
}> {
  const [state, setState] = useState<
    QueryState<{ supporter: SupporterDetail; donations: DonationRecord[] }>
  >({ data: null, loading: false, error: null });

  useEffect(() => {
    if (id == null) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((prev) => {
      const keepData =
        prev.data?.supporter.supporterId === id ? prev.data : undefined;
      return {
        data: keepData ?? null,
        loading: true,
        error: null,
      };
    });

    Promise.all([
      apiGet<SupporterDetail>(`/api/Supporters/${id}`),
      apiGet<DonationRecord[]>(`/api/Supporters/${id}/donations`),
    ]).then(([detailRes, donationRes]) => {
      if (cancelled) return;
      if (detailRes.data && donationRes.data) {
        setState({
          data: { supporter: detailRes.data, donations: donationRes.data },
          loading: false,
          error: null,
        });
      } else {
        const mock = MOCK_DETAILS[id];
        if (mock) {
          setState({
            data: { supporter: mock, donations: mockDonationsFor(id) },
            loading: false,
            error: detailRes.error ?? donationRes.error,
          });
        } else {
          setState({
            data: null,
            loading: false,
            error: detailRes.error ?? donationRes.error ?? 'Not found',
          });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id, refreshToken]);

  return state;
}

export function useRecentDonations(days = 30, refreshToken = 0): QueryState<RecentDonation[]> {
  const [state, setState] = useState<QueryState<RecentDonation[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    apiGet<RecentDonation[]>(`/api/Donations/recent?days=${days}`).then((res) => {
      if (cancelled) return;
      setState({
        data: res.data ?? MOCK_RECENT,
        loading: false,
        error: res.error,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [days, refreshToken]);

  return state;
}

export function useDonationsByProgramArea(refreshToken = 0): QueryState<ProgramAreaTotal[]> {
  const [state, setState] = useState<QueryState<ProgramAreaTotal[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    apiGet<ProgramAreaTotal[]>('/api/Donations/by-program-area').then((res) => {
      if (cancelled) return;
      setState({
        data: res.data ?? MOCK_PROGRAM_AREAS,
        loading: false,
        error: res.error,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  return state;
}

export function useDonationsByProgramAreaForSupporter(
  supporterId: number | null,
  refreshToken = 0
): QueryState<ProgramAreaTotal[]> {
  const [state, setState] = useState<QueryState<ProgramAreaTotal[]>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (supporterId == null) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    apiGet<ProgramAreaTotal[]>(`/api/Donations/by-program-area/supporter/${supporterId}`).then((res) => {
      if (cancelled) return;
      setState({
        data: res.data ?? [],
        loading: false,
        error: res.error,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [supporterId, refreshToken]);

  return state;
}
