export interface ImpactSummary {
  total_residents: number
  active_residents: number
  completed_reintegrations: number
  total_donations_php: number
  unique_donors: number
  active_safehouses: number
}

export interface OutcomeRow {
  label: string
  count: number
}

export interface MonthlyDonation {
  month: string
  total_php: number
}
