export type DonorDashboardDonationType =
  | 'Monetary'
  | 'InKind'
  | 'Time'
  | 'Skills'
  | 'SocialMedia'
  | string;

export interface DonationAllocationDto {
  allocationId: number;
  donationId: number;
  safehouseId: number;
  programArea: string;
  amountAllocated: number;
  allocationDate: string;
  allocationNotes: string | null;
}

export interface InKindDonationItemDto {
  itemId: number;
  donationId: number;
  itemName: string;
  itemCategory: string;
  quantity: number;
  unitOfMeasure: string;
  estimatedUnitValue: number;
  intendedUse: string;
  receivedCondition: string;
}

export interface DonorDashboardDonationDto {
  donationId: number;
  supporterId: number;
  donationType: DonorDashboardDonationType;
  donationDate: string | null;
  isRecurring: boolean;
  campaignName: string | null;
  channelSource: string | null;
  currencyCode: string | null;
  amount: number | null;
  estimatedValue: number;
  impactUnit: string;
  notes: string | null;
  referralPostId: number | null;
  donationAllocations: DonationAllocationDto[];
  inKindDonationItems: InKindDonationItemDto[];
}

export type GetDonationsResponseDto = DonorDashboardDonationDto[];

export interface CreateDonationAllocationRequestDto {
  safehouseId: number;
  programArea: string;
  amountAllocated: number;
  allocationDate: string;
  allocationNotes: string | null;
}

export interface CreateInKindDonationItemRequestDto {
  itemName: string;
  itemCategory: string;
  quantity: number;
  unitOfMeasure: string;
  estimatedUnitValue: number;
  intendedUse: string;
  receivedCondition: string;
}

export interface CreateDonationRequestDto {
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
  referralPostId: number | null;
  donationAllocations: CreateDonationAllocationRequestDto[];
  inKindDonationItems: CreateInKindDonationItemRequestDto[];
}

/** Same payload shape as create; used with PUT /api/Donations/{id}. */
export type UpdateDonationRequestDto = CreateDonationRequestDto;

