import type { CaseloadRow } from '../types/resident'

export const mockCaseloadRows: CaseloadRow[] = [
  {
    id: 'CASE-1001',
    name: 'Maria Santos',
    category: 'Recovery',
    subCategory: 'Post-Trauma',
    safehouse: 'North Shelter',
    socialWorker: 'L. Reyes',
    status: 'ACTIVE',
  },
  {
    id: 'CASE-1002',
    name: 'Juan Dela Cruz',
    category: 'Vocational',
    subCategory: 'Skill Dev',
    safehouse: 'Central Hub',
    socialWorker: 'M. Tan',
    status: 'PENDING',
  },
  {
    id: 'CASE-1003',
    name: 'Elena Dimagiba',
    category: 'Recovery',
    subCategory: 'Substance',
    safehouse: 'South Haven',
    socialWorker: 'L. Reyes',
    status: 'ACTIVE',
  },
  {
    id: 'CASE-1004',
    name: 'Roberto Gomez',
    category: 'Transitional',
    subCategory: 'Reintegration',
    safehouse: 'North Shelter',
    socialWorker: 'J. Villanueva',
    status: 'ARCHIVED',
  },
]
