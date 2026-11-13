import { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { deleteNotification, fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../features/notifications/notificationService';

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function NotificationsPage() {
  const [result, setResult] = useState({ items: [], unread: 0, pagination: { page: 1, pages: 1, total: 0 } });
  const [error, setError] = useState('');

  async function refresh() {
    try { setError(''); setResult(await fetchNotifications({ page: 1, limit: 50 })); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load notifications.'); }
  }

  useEffect(() => { refresh(); }, []);

  async function read(id) { await markNotificationRead(id); await refresh(); }
  async function readAll() { await markAllNotificationsRead(); await refresh(); }
  async function remove(id) { await deleteNotification(id); await refresh(); }

  return (
    <div className="page-stack">
      <div className="page-heading"><div><p className="eyebrow">ACTIVITY</p><h2>Notification center</h2><p className="page-subtitle">Review reminders and important account events.</p></div><div className="form-actions">{result.unread > 0 && <Button variant="ghost" onClick={readAll}>Mark all as read</Button>}<Button onClick={refresh}>Refresh</Button></div></div>
      {error && <Card><p className="form-error">{error}</p></Card>}
      <Card>
        {result.items.length ? <div className="notification-history">{result.items.map((notification) => (
          <div className={`notification-history-row ${notification.readAt ? '' : 'notification-unread'}`} key={notification._id}>
            <div><h3>{notification.title}</h3><p className="card-hint">{notification.message}</p><small className="notification-date">{formatDate(notification.createdAt)}</small></div>
            <div className="form-actions">{!notification.readAt && <Button variant="ghost" onClick={() => read(notification._id)}>Mark read</Button>}<Button variant="ghost" onClick={() => remove(notification._id)}>Delete</Button></div>
          </div>
        ))}</div> : <div className="empty-state">No notifications yet. Enable them in Settings when you are ready.</div>}
      </Card>
    </div>
  );
}
