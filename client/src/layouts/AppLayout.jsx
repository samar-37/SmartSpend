import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Button from '../components/ui/Button';
import ConnectivityStatus from '../components/ui/ConnectivityStatus';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../features/notifications/NotificationBell';
import BudgetAlertPopup from '../features/notifications/BudgetAlertPopup';

export default function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <BudgetAlertPopup />
      <Sidebar />
      <div className="app-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">PERSONAL FINANCE</p>
            <h1 className="topbar-title">Good morning</h1>
          </div>
          <div className="topbar-actions">
            <ConnectivityStatus />
            <NotificationBell />
            <span className="user-name">{user?.name}</span>
            <Button variant="ghost" onClick={toggleTheme} aria-label="Toggle color theme">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </Button>
            <Button variant="ghost" onClick={logout}>Sign out</Button>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
