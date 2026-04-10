export interface MlPipelineStatusRow {
  id: string;
  notebook: string;
  uiPath: string;
  dotnetRoute: string;
  /** FastAPI routes on the ML service (Ml:BaseUrl), e.g. POST /predict/donor-churn */
  mlApiRoute: string;
  mlModelLoaded: boolean;
  error: string | null;
}

export interface MlDeploymentStatus {
  mlServiceConfigured: boolean;
  mlReachable?: boolean;
  message?: string;
  /** Host .NET uses for Ml:BaseUrl (admin diagnostics; avoids Azure Log Stream). */
  mlBaseUrlHost?: string | null;
  mlApiKeyConfigured?: boolean;
  checkedAtUtc: string;
  pipelines: MlPipelineStatusRow[];
}

export interface DonorChurnScoreRow {
  supporterId: number;
  churnProbability: number;
  tier: string;
  recommendedAction: string;
  error: string | null;
}

export interface ResidentWellbeingScoreRow {
  residentId: number;
  /** Case control no. from SQL — same staff-facing label as Caseload (no separate legal name column). */
  residentName: string;
  predictedWellbeingNext: number;
  wellbeingLag: number;
  error: string | null;
}

export interface DonorHighValueScoreRow {
  supporterId: number;
  highValueProbability: number;
  error: string | null;
}

export interface EarlyWarningScoreRow {
  residentId: number;
  residentName: string;
  struggleProbability: number;
  error: string | null;
}

export interface ReintegrationReadinessScoreRow {
  residentId: number;
  residentName: string;
  readinessProbability: number;
  error: string | null;
}

export interface SocialEngagementScoreRow {
  month: string;
  predictedNextMonetary: number;
  error: string | null;
}
