import { useEffect, useState } from 'react';
import { getHealthStatus } from '../../services/api';

export default function ConnectivityStatus() {
  const [status, setStatus] = useState({ loading: true, connected: false, message: '' });

  useEffect(() => {
    let active = true;
    function updateOfflineState() {
      if (!navigator.onLine) setStatus({ loading: false, connected: false, message: 'Offline - read-only shell' });
    }
    function checkHealth() {
      if (!navigator.onLine) return updateOfflineState();
      getHealthStatus()
        .then((data) => active && setStatus({ loading: false, connected: true, message: data.message }))
        .catch(() => active && setStatus({ loading: false, connected: false, message: 'Backend unavailable' }));
    }
    window.addEventListener('online', checkHealth);
    window.addEventListener('offline', updateOfflineState);
    checkHealth();
    return () => {
      active = false;
      window.removeEventListener('online', checkHealth);
      window.removeEventListener('offline', updateOfflineState);
    };
  }, []);

  if (status.loading) return <span className="status status-loading">Checking API...</span>;
  return (
    <span className={`status ${status.connected ? 'status-success' : 'status-error'}`}>
      <span className="status-dot" aria-hidden="true" />
      {status.message}
    </span>
  );
}
