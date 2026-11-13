import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <div className="route-loading">Checking your session...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}
