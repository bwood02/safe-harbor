import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { CaseloadInventoryPage } from './pages/CaseloadInventoryPage'
import { ImpactDashboardPage } from './pages/ImpactDashboardPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/impact" replace /> },
  { path: '/impact', element: <ImpactDashboardPage /> },
  { path: '/admin', element: <AdminDashboardPage /> },
  { path: '/caseload', element: <CaseloadInventoryPage /> },
  { path: '*', element: <Navigate to="/impact" replace /> },
])
