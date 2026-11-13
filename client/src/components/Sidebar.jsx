import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-mark"><span>₹</span> SmartSpend</div>
      <nav aria-label="Primary navigation" className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Dashboard
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Settings
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Profile
        </NavLink>
        <NavLink to="/budgets" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Budgets
        </NavLink>
        <NavLink to="/recurring-payments" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Recurring payments
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Analytics
        </NavLink>
        <NavLink to="/savings-goals" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Savings goals
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Reports
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Notifications
        </NavLink>
        <NavLink to="/insights" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          AI insights
        </NavLink>
        <NavLink to="/forecasts" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Forecasts
        </NavLink>
      </nav>
    </aside>
  );
}
