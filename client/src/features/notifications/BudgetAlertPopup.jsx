import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { fetchActiveBudgetAlerts } from './notificationService';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const alertTypes = new Set(['budget_warning', 'budget_exceeded']);
const dismissedKey = 'smartspend.dismissedBudgetAlerts';

function readDismissed() {
  try { return new Set(JSON.parse(sessionStorage.getItem(dismissedKey) || '[]')); }
  catch { return new Set(); }
}

function rememberDismissed(id) {
  const dismissed = readDismissed();
  dismissed.add(id);
  sessionStorage.setItem(dismissedKey, JSON.stringify([...dismissed]));
}

function chooseAlert(items) {
  const dismissed = readDismissed();
  return items.find((item) => item?.id && alertTypes.has(item.type) && !dismissed.has(item.id)) || null;
}

function displayAlert(alert) {
  const metadata = alert.metadata || alert;
  return {
    ...alert,
    id: alert.id || alert._id,
    budgetId: metadata.budgetId || alert.budgetId,
    category: metadata.category ?? alert.category,
    threshold: metadata.threshold || alert.threshold,
    amountMinor: metadata.amountMinor ?? alert.amountMinor,
    spentMinor: metadata.spentMinor ?? alert.spentMinor,
    remainingMinor: metadata.remainingMinor ?? alert.remainingMinor,
    exceededMinor: metadata.exceededMinor ?? alert.exceededMinor,
  };
}

export default function BudgetAlertPopup() {
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const closeRef = useRef(null);

  async function refresh() {
    try {
      const result = await fetchActiveBudgetAlerts();
      const next = chooseAlert(result.map(displayAlert));
      if (next) setAlert(next);
    } catch {
      // The notification bell remains the fallback when the popup refresh fails.
    }
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 15_000);
    function onCreated(event) {
      const next = chooseAlert((event.detail || []).map(displayAlert));
      if (next) setAlert(next);
    }
    window.addEventListener('budget-alerts-created', onCreated);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('budget-alerts-created', onCreated);
    };
  }, []);

  useEffect(() => {
    if (!alert) return undefined;
    closeRef.current?.focus();
    function onKeyDown(event) {
      if (event.key === 'Escape') dismiss();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [alert]);

  function dismiss() {
    if (alert?.id) rememberDismissed(alert.id);
    setAlert(null);
  }

  if (!alert) return null;
  const exceeded = alert.threshold >= 100 || alert.type === 'budget_exceeded';
  return (
    <div className="modal-backdrop budget-alert-backdrop">
      <div className={`modal budget-alert-modal budget-alert-${exceeded ? 'exceeded' : alert.threshold >= 90 ? 'critical' : 'warning'}`} role="alertdialog" aria-modal="true" aria-labelledby="budget-alert-title" aria-describedby="budget-alert-message">
        <Card>
          <div className="budget-alert-icon" aria-hidden="true">{exceeded ? '⚠' : '!'}</div>
          <p className="eyebrow">{exceeded ? 'ACTION REQUIRED' : 'BUDGET ALERT'}</p>
          <h2 id="budget-alert-title">{exceeded ? 'Budget exceeded' : alert.threshold >= 90 ? 'Budget almost exhausted' : 'Budget getting low'}</h2>
          <p id="budget-alert-message" className="card-hint">{alert.message}</p>
          <dl className="budget-alert-details">
            <div><dt>Budget</dt><dd>{currency.format((alert.amountMinor || 0) / 100)}</dd></div>
            <div><dt>Spent</dt><dd>{currency.format((alert.spentMinor || 0) / 100)}</dd></div>
            {exceeded ? <div><dt>Exceeded by</dt><dd>{currency.format((alert.exceededMinor || 0) / 100)}</dd></div> : <div><dt>Remaining</dt><dd>{currency.format(Math.max(alert.remainingMinor || 0, 0) / 100)}</dd></div>}
          </dl>
          <div className="form-actions">
            <Button onClick={() => { dismiss(); navigate('/budgets'); }}>View budget</Button>
            <Button ref={closeRef} variant="ghost" onClick={dismiss}>Dismiss</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
