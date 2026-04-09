import { Routes, Route, Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import NotFound from '@/pages/not-found';
import HomePage from '@/pages/HomePage';
import ImpactDashboardPage from '@/pages/ImpactDashboard';
import AdminDashboardPage from '@/pages/AdminDashboard';
import CaseloadInventoryPage from '@/pages/CaseloadInventory';
import DonorDashboardPage from '@/pages/DonorDashboard';
import DonorsContributionsPage from '@/pages/DonorsContributions';
import ProcessRecordingPage from '@/pages/ProcessRecording';
import VisitationLogsPage from '@/pages/VisitationLogs';
import ReportsAnalyticsPage from '@/pages/ReportsAnalytics';
import SocialMediaDashboardPage from '@/pages/SocialMediaDashboard';
import MlIntegrationPage from '@/pages/MlIntegrationPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import LogoutPage from '@/pages/LogoutPage';
import CookieBanner from '@/components/shared/CookieBanner';
import AppHeader from '@/components/shared/AppHeader';
import { useAuth } from '@/context/AuthContext';

function RequireRole({
  roles,
  children,
}: {
  roles: string[];
  children: ReactElement;
}) {
  const { authSession, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = authSession.roles ?? [];
  const allowed = roles.some((role) => userRoles.includes(role));
  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <CookieBanner />
      <AppHeader />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/impact" element={<ImpactDashboardPage />} />
        <Route
          path="/donor"
          element={
            <RequireRole roles={['Donor']}>
              <DonorDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRole roles={['Admin']}>
              <AdminDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/ml-integration"
          element={
            <RequireRole roles={['Admin']}>
              <MlIntegrationPage />
            </RequireRole>
          }
        />
        <Route
          path="/caseload"
          element={
            <RequireRole roles={['Admin']}>
              <CaseloadInventoryPage />
            </RequireRole>
          }
        />
        <Route
          path="/donors"
          element={
            <RequireRole roles={['Admin']}>
              <DonorsContributionsPage />
            </RequireRole>
          }
        />
        <Route
          path="/process-recordings"
          element={
            <RequireRole roles={['Admin']}>
              <ProcessRecordingPage />
            </RequireRole>
          }
        />
        <Route
          path="/visitation-logs"
          element={
            <RequireRole roles={['Admin']}>
              <VisitationLogsPage />
            </RequireRole>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireRole roles={['Admin']}>
              <ReportsAnalyticsPage />
            </RequireRole>
          }
        />
        <Route
          path="/social-media"
          element={
            <RequireRole roles={['Admin']}>
              <SocialMediaDashboardPage />
            </RequireRole>
          }
        />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}