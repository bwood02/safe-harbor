import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

export interface ResidentPicker {
  residentId: number;
  caseControlNo: string;
  safehouseId: number;
  caseStatus: string;
  presentAge: string;
  assignedSocialWorker: string;
  currentRiskLevel: string;
}

export interface ProcessRecordingSession {
  recordingId: number;
  residentId: number;
  sessionDate: string;
  socialWorker: string;
  sessionType: string;
  sessionDurationMinutes: number;
  emotionalStateObserved: string;
  emotionalStateEnd: string;
  sessionNarrative: string;
  interventionsApplied: string;
  followUpActions: string;
  progressNoted: boolean;
  concernsFlagged: boolean;
  referralMade: boolean;
}

export interface PagedProcessRecordingSessions {
  items: ProcessRecordingSession[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const mockResidents: ResidentPicker[] = [
  {
    residentId: 1,
    caseControlNo: 'SH-2025-0142',
    safehouseId: 1,
    caseStatus: 'Active',
    presentAge: '14',
    assignedSocialWorker: 'Maria Santos',
    currentRiskLevel: 'Moderate',
  },
  {
    residentId: 2,
    caseControlNo: 'SH-2025-0156',
    safehouseId: 1,
    caseStatus: 'Active',
    presentAge: '16',
    assignedSocialWorker: 'Jasmine Cruz',
    currentRiskLevel: 'Low',
  },
  {
    residentId: 3,
    caseControlNo: 'SH-2025-0171',
    safehouseId: 2,
    caseStatus: 'Active',
    presentAge: '12',
    assignedSocialWorker: 'Maria Santos',
    currentRiskLevel: 'High',
  },
  {
    residentId: 4,
    caseControlNo: 'SH-2026-0008',
    safehouseId: 3,
    caseStatus: 'Active',
    presentAge: '15',
    assignedSocialWorker: 'Ana Reyes',
    currentRiskLevel: 'Moderate',
  },
];

function makeMockSessions(residentId: number): ProcessRecordingSession[] {
  const base: Omit<ProcessRecordingSession, 'recordingId' | 'residentId' | 'sessionDate'>[] = [
    {
      socialWorker: 'Maria Santos',
      sessionType: 'Individual',
      sessionDurationMinutes: 55,
      emotionalStateObserved: 'Anxious',
      emotionalStateEnd: 'Calm',
      sessionNarrative:
        'Resident expressed concern about upcoming family visit. Explored feelings through journaling prompts.',
      interventionsApplied: 'CBT, Grounding exercises',
      followUpActions: 'Coordinate with guardian; review before next session',
      progressNoted: true,
      concernsFlagged: false,
      referralMade: false,
    },
    {
      socialWorker: 'Jasmine Cruz',
      sessionType: 'Group',
      sessionDurationMinutes: 45,
      emotionalStateObserved: 'Withdrawn',
      emotionalStateEnd: 'Engaged',
      sessionNarrative: 'Participated in peer sharing circle. Contributed by the end of the session.',
      interventionsApplied: 'Group therapy, Art',
      followUpActions: 'Continue group sessions',
      progressNoted: true,
      concernsFlagged: false,
      referralMade: false,
    },
    {
      socialWorker: 'Maria Santos',
      sessionType: 'Crisis',
      sessionDurationMinutes: 75,
      emotionalStateObserved: 'Distressed',
      emotionalStateEnd: 'Stabilized',
      sessionNarrative: 'Crisis triggered by nightmare. Used trauma-informed stabilization techniques.',
      interventionsApplied: 'Crisis intervention, Breathing',
      followUpActions: 'Schedule psychiatrist consult',
      progressNoted: false,
      concernsFlagged: true,
      referralMade: true,
    },
  ];

  return base.map((b, i) => ({
    ...b,
    recordingId: residentId * 100 + i,
    residentId,
    sessionDate: new Date(2026, 2, 20 - i * 7).toISOString().slice(0, 10),
  }));
}

export function useResidentsForPicker(): QueryState<ResidentPicker[]> {
  const [state, setState] = useState<QueryState<ResidentPicker[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    apiGet<ResidentPicker[]>('/api/Residents?status=Active').then((res) => {
      if (cancelled) return;
      if (res.data && res.data.length > 0) {
        setState({ data: res.data, loading: false, error: null });
      } else {
        setState({ data: mockResidents, loading: false, error: res.error });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function useProcessRecordings(
  residentId: number | null,
  page: number,
  pageSize: number,
  reloadToken?: number,
): QueryState<PagedProcessRecordingSessions> {
  const [state, setState] = useState<QueryState<PagedProcessRecordingSessions>>({
    data: null,
    loading: true,
    error: null,
  });

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
    apiGet<PagedProcessRecordingSessions>(
      `/api/ProcessRecordings?residentId=${residentId}&page=${page}&pageSize=${pageSize}`,
    ).then((res) => {
      if (cancelled) return;
      if (res.data) {
        setState({ data: res.data, loading: false, error: null });
      } else {
        const mockAll = makeMockSessions(residentId);
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
  }, [residentId, page, pageSize, reloadToken]);

  return state;
}
