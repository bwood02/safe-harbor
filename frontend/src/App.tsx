import { Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <>
      <CookieBanner />
      <AppHeader />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/impact" element={<ImpactDashboardPage />} />
        <Route path="/donor" element={<DonorDashboardPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/ml-integration" element={<MlIntegrationPage />} />
        <Route path="/caseload" element={<CaseloadInventoryPage />} />
        <Route path="/donors" element={<DonorsContributionsPage />} />
        <Route path="/process-recordings" element={<ProcessRecordingPage />} />
        <Route path="/visitation-logs" element={<VisitationLogsPage />} />
        <Route path="/reports" element={<ReportsAnalyticsPage />} />
        <Route path="/social-media" element={<SocialMediaDashboardPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}