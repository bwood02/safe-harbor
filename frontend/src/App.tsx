import { Switch, Route, Redirect } from 'wouter';
import NotFound from '@/pages/not-found';
import ImpactDashboardPage from '@/pages/ImpactDashboard';
import AdminDashboardPage from '@/pages/AdminDashboard';
import CaseloadInventoryPage from '@/pages/CaseloadInventory';

export default function App() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/impact" />
      </Route>
      <Route path="/impact" component={ImpactDashboardPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/caseload" component={CaseloadInventoryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}
