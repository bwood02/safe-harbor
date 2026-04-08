import { Switch, Route } from 'wouter';
import NotFound from '@/pages/not-found';
import HomePage from '@/pages/HomePage';
import ImpactDashboardPage from '@/pages/ImpactDashboard';
import AdminDashboardPage from '@/pages/AdminDashboard';
import CaseloadInventoryPage from '@/pages/CaseloadInventory';
import DonorDashboardPage from '@/pages/DonorDashboard';
import DonorsContributionsPage from '@/pages/DonorsContributions';
import ProcessRecordingPage from '@/pages/ProcessRecording';

export default function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/impact" component={ImpactDashboardPage} />
      <Route path="/donor" component={DonorDashboardPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/caseload" component={CaseloadInventoryPage} />
      <Route path="/donors" component={DonorsContributionsPage} />
      <Route path="/process-recordings" component={ProcessRecordingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}
