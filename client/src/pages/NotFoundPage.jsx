import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return <div className="empty-state"><h2>Page not found</h2><Link className="text-link" to="/dashboard">Return to dashboard</Link></div>;
}
