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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/impact" element={<ImpactDashboardPage />} />
      <Route path="/donor" element={<DonorDashboardPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/caseload" element={<CaseloadInventoryPage />} />
      <Route path="/donors" element={<DonorsContributionsPage />} />
      <Route path="/process-recordings" element={<ProcessRecordingPage />} />
      <Route path="/home-visits" element={<VisitationLogsPage />} />
      <Route path="/reports" element={<ReportsAnalyticsPage />} />
      <Route path="/social-media" element={<SocialMediaDashboardPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
