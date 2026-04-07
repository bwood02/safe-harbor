export type ResidentStatus = 'ACTIVE' | 'PENDING' | 'ARCHIVED'

export interface CaseloadRow {
  id: string
  name: string
  category: string
  subCategory: string
  safehouse: string
  socialWorker: string
  status: ResidentStatus
}
