export interface ResidentListItem {
  residentId: number;
  caseControlNo: string;
  internalCode: number;
  safehouseId: number;
  safehouseName: string;
  caseStatus: string;
  caseCategory: string;
  presentAge: string;
  dateOfAdmission: string;
  lengthOfStay: string;
  assignedSocialWorker: string;
  currentRiskLevel: string;
  reintegrationStatus: string;
}

export interface ResidentFull {
  residentId: number;
  caseControlNo: string;
  internalCode: number;
  safehouseId: number;
  caseStatus: string;
  sex: string;
  dateOfBirth: string;
  birthStatus: string;
  placeOfBirth: string;
  religion: string;
  caseCategory: string;
  subCatOrphaned: boolean;
  subCatTrafficked: boolean;
  subCatChildLabor: boolean;
  subCatPhysicalAbuse: boolean;
  subCatSexualAbuse: boolean;
  subCatOsaec: boolean;
  subCatCicl: boolean;
  subCatAtRisk: boolean;
  subCatStreetChild: boolean;
  subCatChildWithHiv: boolean;
  isPwd: boolean;
  pwdType: string | null;
  hasSpecialNeeds: boolean;
  specialNeedsDiagnosis: string | null;
  familyIs4ps: boolean;
  familySoloParent: boolean;
  familyIndigenous: boolean;
  familyParentPwd: boolean;
  familyInformalSettler: boolean;
  dateOfAdmission: string;
  ageUponAdmission: string;
  presentAge: string;
  lengthOfStay: string;
  referralSource: string;
  referringAgencyPerson: string | null;
  dateColbRegistered: string | null;
  dateColbObtained: string | null;
  assignedSocialWorker: string;
  initialCaseAssessment: string;
  dateCaseStudyPrepared: string | null;
  reintegrationType: string;
  reintegrationStatus: string;
  initialRiskLevel: string;
  currentRiskLevel: string;
  dateEnrolled: string;
  dateClosed: string | null;
}

export interface ResidentDetail {
  resident: ResidentFull;
  safehouseName: string;
  processRecordingCount: number;
  homeVisitCount: number;
  openInterventionPlansCount: number;
  incidentCount: number;
}

export interface SafehouseOption {
  safehouseId: number;
  name: string;
  safehouseCode: string;
}

export interface CaseloadFilters {
  search?: string;
  status?: string;
  safehouseId?: number;
  category?: string;
  riskLevel?: string;
}

export interface CaseloadFilterOptions {
  statuses: string[];
  categories: string[];
  riskLevels: string[];
  socialWorkers: string[];
}

export interface PagedResidents {
  items: ResidentListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ResidentInput = Omit<
  ResidentFull,
  'residentId' | 'dateEnrolled' | 'dateClosed'
>;
