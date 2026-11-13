import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { fetchNotificationPreferences, updateNotificationPreferences } from './notificationService';

const fields = [
  ['recurringPayment', 'Upcoming recurring payments'],
  ['budgetWarning', 'Budget alerts enabled'],
  ['budgetWarning75', 'Budget getting low (75%)'],
  ['budgetWarning90', 'Budget almost exhausted (90%)'],
  ['budgetExceeded', 'Budget exceeded'],
  ['savingsMilestone', 'Savings goal milestones'],
  ['monthlySummary', 'Monthly financial summary'],
  ['accountEvent', 'Important account events'],
];

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotificationPreferences().then(setPreferences).catch(() => setError('Unable to load notification preferences.'));
  }, []);

  async function update(name, value) {
    const next = { ...preferences, [name]: value };
    setPreferences(next);
    try {
      setMessage(''); setError('');
      const result = await updateNotificationPreferences(next);
      setPreferences(result.preferences);
      if (result.budgetAlerts?.length) window.dispatchEvent(new CustomEvent('budget-alerts-created', { detail: result.budgetAlerts }));
      setMessage('Notification preferences saved.');
    }
    catch { setError('Unable to save notification preferences.'); }
  }

  if (!preferences) return <Card><p className="card-hint">Loading notification preferences...</p></Card>;
  return <Card><div className="card-heading"><div><h3>Notification settings</h3><p className="card-hint">Notifications are opt-in and stay inside SmartSpend.</p></div><span className={preferences.consentGranted ? 'status status-success' : 'status'}>{preferences.consentGranted ? 'Enabled' : 'Disabled'}</span></div>
    <label className="notification-consent"><input type="checkbox" checked={preferences.consentGranted} onChange={(event) => update('consentGranted', event.target.checked)} /> Allow SmartSpend to create in-app notifications</label>
    <div className="notification-preferences">{fields.map(([name, label]) => <label key={name}><span>{label}</span><input type="checkbox" checked={preferences[name]} disabled={!preferences.consentGranted} onChange={(event) => update(name, event.target.checked)} /></label>)}</div>
    {message && <p className="form-success">{message}</p>}{error && <p className="form-error">{error}</p>}
  </Card>;
}
