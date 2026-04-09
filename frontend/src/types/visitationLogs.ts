export interface HomeVisit {
  visitationId: number;
  residentId: number;
  visitDate: string;
  socialWorker: string;
  visitType: string;
  locationVisited: string;
  familyMembersPresent: string;
  purpose: string;
  observations?: string | null;
  familyCooperationLevel: string;
  safetyConcernsNoted: boolean;
  followUpNeeded: boolean;
  followUpNotes?: string | null;
  visitOutcome: string;
}

export type HomeVisitInput = Omit<HomeVisit, 'visitationId'>;

export interface CaseConference {
  planId: number;
  residentId: number;
  caseConferenceDate: string;
  planCategory: string;
  planDescription: string;
  servicesProvided: string;
  status: string;
}

export const VISIT_TYPES = [
  'Initial',
  'Follow-up',
  'Monitoring',
  'Pre-Reintegration',
  'Post-Reintegration',
  'Crisis',
] as const;

export const COOPERATION_LEVELS = ['Low', 'Moderate', 'High'] as const;
