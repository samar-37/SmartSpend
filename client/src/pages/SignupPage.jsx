import { Link, Navigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { user, register, error } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <div className="auth-page"><div className="auth-panel"><div className="brand-mark"><span>₹</span> SmartSpend</div><p className="eyebrow">GET STARTED</p><h1>Create your account</h1><p className="page-subtitle">Build a clearer, more confident financial future.</p><AuthForm mode="signup" onSubmit={register} error={error} /><p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p></div></div>;
}
