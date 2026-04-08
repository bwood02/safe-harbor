export interface CreateSupporterRequestDto {
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
  firstDonationDate: string | null;
  acquisitionChannel: string;
}

export type UpdateSupporterRequestDto = CreateSupporterRequestDto;

export interface SupporterDto {
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
