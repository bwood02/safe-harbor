export interface ApiEnvelope<T> {
  data: T | null;
  error: string | null;
  message: string | null;
}

export interface DonationTrendPoint {
  period: string;
  donationCount: number;
  totalPhp: number;
}

export interface DonationByCampaign {
  campaignName: string;
  totalPhp: number;
  donorCount: number;
}

export interface DonationByType {
  donationType: string;
  totalPhp: number;
  count: number;
}

export interface ResidentOutcomePoint {
  period: string;
  avgEducationProgress: number;
  avgHealthScore: number;
  activeResidentCount: number;
}

export interface SafehouseComparisonRow {
  safehouseId: number;
  safehouseName: string;
  activeResidents: number;
  avgEducationProgress: number;
  avgHealthScore: number;
  incidentCount: number;
  processRecordingCount: number;
  homeVisitCount: number;
}

export interface CountBucket {
  key: string;
  count: number;
}

export interface ReintegrationOutcomes {
  statusBreakdown: CountBucket[];
  typeBreakdown: CountBucket[];
  completionRatePercent: number;
}

export interface AnnualAccomplishment {
  year: number;
  servicesProvided: {
    caring: number;
    healing: number;
    teaching: number;
  };
  beneficiaries: {
    totalServed: number;
    activeAtYearEnd: number;
  };
  outcomes: {
    reintegrationsCompleted: number;
    educationCompletions: number;
    avgHealthImprovement: number;
  };
}

export interface ReportsDateRange {
  fromDate: string | null;
  toDate: string | null;
}
