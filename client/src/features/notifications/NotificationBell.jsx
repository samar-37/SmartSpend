import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from './notificationService';

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');
  const containerRef = useRef(null);

  async function refresh() {
    try {
      const result = await fetchNotifications({ page: 1, limit: 5 });
      setNotifications(result.items);
      setUnread(result.unread);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to refresh notifications.');
    }
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function close(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  async function read(id) {
    await markNotificationRead(id);
    await refresh();
  }

  async function readAll() {
    await markAllNotificationsRead();
    await refresh();
  }

  return (
    <div className="notification-bell" ref={containerRef}>
      <Button variant="ghost" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} onClick={() => setOpen(!open)}>
        Notifications {unread > 0 && <span className="notification-count">{unread > 99 ? '99+' : unread}</span>}
      </Button>
      {open && <div className="notification-dropdown" role="dialog" aria-label="Recent notifications">
        <div className="card-heading"><h3>Notifications</h3>{unread > 0 && <Button variant="ghost" onClick={readAll}>Mark all read</Button>}</div>
        {error && <p className="form-error">{error}</p>}
        {notifications.length ? notifications.map((notification) => (
          <button className={`notification-item ${notification.readAt ? '' : 'notification-unread'}`} key={notification._id} onClick={() => read(notification._id)}>
            <strong>{notification.title}</strong>
            <span>{notification.message}</span>
            <small>{formatDate(notification.createdAt)}</small>
          </button>
        )) : <p className="empty-state">No notifications yet.</p>}
        <Link className="text-link notification-center-link" to="/notifications" onClick={() => setOpen(false)}>Open notification center</Link>
      </div>}
    </div>
  );
}
