import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import type { HomeVisit, HomeVisitInput, CaseConference, PagedHomeVisits } from '@/types/visitationLogs';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const mockVisits = (residentId: number): HomeVisit[] => [
  {
    visitationId: residentId * 10 + 1,
    residentId,
    visitDate: '2026-03-15',
    socialWorker: 'Maria Santos',
    visitType: 'Follow-up',
    locationVisited: 'Family home, Quezon City',
    familyMembersPresent: 'Mother, grandmother',
    purpose: 'Reintegration readiness check',
    observations: 'Home environment safe; mother engaged.',
    familyCooperationLevel: 'High',
    safetyConcernsNoted: false,
    followUpNeeded: true,
    followUpNotes: 'Next visit in 30 days',
    visitOutcome: 'Positive',
  },
  {
    visitationId: residentId * 10 + 2,
    residentId,
    visitDate: '2026-02-10',
    socialWorker: 'Jasmine Cruz',
    visitType: 'Initial',
    locationVisited: 'Family home, Quezon City',
    familyMembersPresent: 'Mother',
    purpose: 'Baseline family assessment',
    observations: 'Some tension observed; follow up recommended.',
    familyCooperationLevel: 'Moderate',
    safetyConcernsNoted: false,
    followUpNeeded: true,
    followUpNotes: '',
    visitOutcome: 'Needs Follow-up',
  },
];

const mockConferences: CaseConference[] = [
  {
    planId: 1,
    residentId: 1,
    caseConferenceDate: '2026-03-01',
    planCategory: 'Education',
    planDescription: 'Reinstate schooling with tutoring support.',
    servicesProvided: 'Teaching',
    status: 'In Progress',
  },
];

export function useVisits(
  residentId: number | null,
  page: number,
  pageSize: number,
): QueryState<PagedHomeVisits> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<PagedHomeVisits>>({
    data: null,
    loading: true,
    error: null,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (residentId == null) {
      setState({
        data: { items: [], totalCount: 0, page: 1, pageSize, totalPages: 1 },
        loading: false,
        error: null,
      });
      return;
    }
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    apiGet<PagedHomeVisits>(
      `/api/VisitationLogs/visits?residentId=${residentId}&page=${page}&pageSize=${pageSize}`,
    ).then((res) => {
      if (cancelled) return;
      if (res.data) {
        setState({ data: res.data, loading: false, error: null });
      } else {
        const mockAll = mockVisits(residentId);
        const safePage = Math.max(1, page);
        const safePageSize = Math.max(1, pageSize);
        const totalCount = mockAll.length;
        const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / safePageSize);
        const clampedPage = Math.min(safePage, totalPages);
        const items = mockAll.slice((clampedPage - 1) * safePageSize, clampedPage * safePageSize);
        setState({
          data: { items, totalCount, page: clampedPage, pageSize: safePageSize, totalPages },
          loading: false,
          error: res.error,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [residentId, page, pageSize, tick]);

  return { ...state, refetch: () => setTick((t) => t + 1) };
}

export function useCaseConferences(residentId: number | null): QueryState<CaseConference[]> {
  const [state, setState] = useState<QueryState<CaseConference[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (residentId == null) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    apiGet<CaseConference[]>(`/api/VisitationLogs/case-conferences?residentId=${residentId}`).then(
      (res) => {
        if (cancelled) return;
        if (res.data) {
          setState({ data: res.data, loading: false, error: null });
        } else {
          setState({
            data: mockConferences.filter((c) => c.residentId === residentId),
            loading: false,
            error: res.error,
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [residentId]);

  return state;
}

export function useVisitMutations() {
  const create = useCallback(async (input: HomeVisitInput) => {
    return apiPost<HomeVisitInput, HomeVisit>('/api/VisitationLogs/visits', input);
  }, []);

  const update = useCallback(async (id: number, input: HomeVisitInput) => {
    return apiPut<HomeVisitInput, HomeVisit>(`/api/VisitationLogs/visits/${id}`, input);
  }, []);

  const remove = useCallback(async (id: number) => {
    return apiDelete<unknown>(`/api/VisitationLogs/visits/${id}`);
  }, []);

  return { create, update, remove };
}
