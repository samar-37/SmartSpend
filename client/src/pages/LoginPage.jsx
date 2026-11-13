import { Link, Navigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, login, error } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <div className="auth-page"><div className="auth-panel"><div className="brand-mark"><span>₹</span> SmartSpend</div><p className="eyebrow">WELCOME BACK</p><h1>Sign in to your finances</h1><p className="page-subtitle">Secure access to your personal finance workspace.</p><AuthForm mode="login" onSubmit={login} error={error} /><p className="auth-switch">New to SmartSpend? <Link to="/signup">Create an account</Link></p></div></div>;
}
