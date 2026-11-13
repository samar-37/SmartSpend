import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './routes/ProtectedRoute';
import BudgetManager from './features/budgets/BudgetManager';
import RecurringPaymentsPage from './features/recurring/RecurringPaymentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SavingsGoalsPage from './pages/SavingsGoalsPage';
import SavingsGoalDetailPage from './pages/SavingsGoalDetailPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import InsightsPage from './pages/InsightsPage';
import ForecastPage from './pages/ForecastPage';
import PwaControls from './components/ui/PwaControls';

export default function App() {
  return (
    <>
    <PwaControls />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ProtectedRoute />}><Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/budgets" element={<BudgetManager />} />
        <Route path="/recurring-payments" element={<RecurringPaymentsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/savings-goals" element={<SavingsGoalsPage />} />
        <Route path="/savings-goals/:id" element={<SavingsGoalDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/forecasts" element={<ForecastPage />} />
      </Route></Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}
