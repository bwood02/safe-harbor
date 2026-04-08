export interface DonationFormSafehouseOptionDto {
  safehouseId: number;
  name: string;
  region: string;
  city: string;
  status: string;
}

export interface DonationFormContextDto {
  safehouses: DonationFormSafehouseOptionDto[];
  programAreas: string[];
}
