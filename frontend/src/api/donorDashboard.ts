import type { GetDonationsResponseDto } from '@/types/donorDashboard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export async function getDonationsBySupporterId(
  supporterId: number,
): Promise<GetDonationsResponseDto> {
  if (!API_BASE_URL) {
    throw new Error('Missing VITE_API_BASE_URL in frontend environment.');
  }

  const response = await fetch(
    `${API_BASE_URL}/DonorDashboard/GetDonations?supporter_id=${supporterId}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to load donations (${response.status}).`);
  }

  return (await response.json()) as GetDonationsResponseDto;
}

