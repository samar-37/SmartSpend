import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { fetchCategories } from '../transactions/transactionService';
import { paymentMethods } from '../transactions/transactionConstants';
import { changeRecurringStatus, createRecurringPayment, fetchRecurringHistory, fetchRecurringPayments, fetchUpcomingPayments, recordRecurringOccurrence, skipRecurringOccurrence, updateRecurringPayment } from './recurringService';

const today = new Date().toISOString().slice(0, 10);
const empty = { title: '', amount: '', type: 'expense', category: 'Bills', paymentMethod: 'upi', notes: '', frequency: 'monthly', interval: 1, intervalUnit: 'month', startDate: today, endDate: '', timezone: 'UTC' };
const labels = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly', custom: 'Custom interval' };
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

function ScheduleCard({ schedule, onEdit, onStatus, onHistory }) {
  return <article className={`recurring-card recurring-${schedule.status}`}>
    <div className="card-heading"><div><h3>{schedule.title}</h3><p className="card-hint">{currency.format(Number(schedule.amount))} · {labels[schedule.frequency]}{schedule.frequency === 'custom' ? ` (${schedule.interval} ${schedule.intervalUnit})` : ''}</p></div><span className="badge">{schedule.status}</span></div>
    <p className="recurring-meta">{schedule.type} · {schedule.category} · starts {schedule.startDate}{schedule.endDate ? ` · ends ${schedule.endDate}` : ''}</p>
    <p className="recurring-next">{schedule.nextOccurrence ? `Next expected payment: ${schedule.nextOccurrence}` : 'No upcoming occurrence'}</p>
    <div className="form-actions"><Button variant="ghost" onClick={() => onHistory(schedule)}>History</Button>{schedule.status !== 'cancelled' && <Button variant="ghost" onClick={() => onEdit(schedule)}>Edit</Button>}{schedule.status === 'active' && <Button variant="ghost" onClick={() => onStatus(schedule, 'pause')}>Pause</Button>}{schedule.status === 'paused' && <Button variant="ghost" onClick={() => onStatus(schedule, 'resume')}>Resume</Button>}{schedule.status !== 'cancelled' && <Button variant="ghost" onClick={() => onStatus(schedule, 'cancel')}>Cancel</Button>}</div>
  </article>;
}

export default function RecurringPaymentsPage() {
  const [schedules, setSchedules] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [history, setHistory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try {
      setError('');
      const [all, next, available] = await Promise.all([fetchRecurringPayments(), fetchUpcomingPayments(), fetchCategories()]);
      setSchedules(all); setUpcoming(next); setCategories(available);
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load recurring payments.'); }
  }
  useEffect(() => { load(); }, []);
  function edit(schedule) {
    setEditing(schedule); setForm({ ...schedule, endDate: schedule.endDate || '', interval: schedule.interval || 1, amount: schedule.amount }); setShowForm(true);
  }
  async function save(event) {
    event.preventDefault(); setError(''); setMessage('');
    try {
      const payload = { ...form, endDate: form.endDate || null, interval: Number(form.interval) };
      if (editing) await updateRecurringPayment(editing.id, payload);
      else await createRecurringPayment(payload);
      setShowForm(false); setEditing(null); setForm(empty); setMessage('Recurring payment saved.'); await load();
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to save recurring payment.'); }
  }
  async function status(schedule, action) {
    if (action === 'cancel' && !window.confirm(`Cancel ${schedule.title}? Existing transactions will remain.`)) return;
    try { await changeRecurringStatus(schedule.id, action); setMessage(`Recurring payment ${action}d.`); await load(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to change payment status.'); }
  }
  async function showHistory(schedule) {
    try { setHistory(await fetchRecurringHistory(schedule.id)); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load payment history.'); }
  }
  async function record(item) {
    try { await recordRecurringOccurrence(item.schedule.id, item.occurrenceDate); setMessage('Occurrence recorded as a transaction.'); await load(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to record occurrence.'); }
  }
  async function skip(item) {
    try { await skipRecurringOccurrence(item.schedule.id, item.occurrenceDate); setMessage('Occurrence skipped.'); await load(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to skip occurrence.'); }
  }
  return <div className="page-stack">
    <div className="page-heading"><div><p className="eyebrow">AUTOMATION</p><h2>Recurring payments</h2><p className="page-subtitle">Due schedules are recorded in your normal transaction history automatically.</p></div><Button onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}>Add recurring payment</Button></div>
    {error && <Card><p className="form-error" role="alert">{error}</p></Card>}{message && <p className="form-success">{message}</p>}
    {showForm && <Card><div className="card-heading"><h3>{editing ? 'Edit recurring payment' : 'New recurring payment'}</h3><Button variant="ghost" onClick={() => setShowForm(false)}>Close</Button></div><form className="transaction-form" onSubmit={save}><div className="form-grid"><label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Rent" /></label><label>Amount (₹)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label><label>Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select></label><label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select></label><label>Payment method<select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>{paymentMethods.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label><label>Frequency<select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>{Object.entries(labels).map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>{form.frequency === 'custom' && <><label>Every<input type="number" min="1" max="365" value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })} /></label><label>Unit<select value={form.intervalUnit} onChange={(e) => setForm({ ...form, intervalUnit: e.target.value })}><option value="day">Days</option><option value="week">Weeks</option><option value="month">Months</option></select></label></>}<label>Start date<input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label><label>End date (optional)<input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></label></div><label>Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows="2" /></label><div className="form-actions"><Button type="submit">{editing ? 'Update schedule' : 'Create schedule'}</Button><Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button></div></form></Card>}
    <Card><div className="card-heading"><h3>Upcoming expected payments</h3><span className="badge">{upcoming.length}</span></div>{upcoming.length ? <div className="upcoming-list">{upcoming.map((item) => <div className="upcoming-row" key={`${item.schedule.id}-${item.occurrenceDate}`}><span><strong>{item.schedule.title}</strong><small>{item.schedule.type} · {item.occurrenceDate} · Scheduled</small></span><div className="form-actions"><Button variant="ghost" onClick={() => record(item)}>Record payment</Button><Button variant="ghost" onClick={() => skip(item)}>Skip</Button></div></div>)}</div> : <div className="empty-state">No active upcoming payments.</div>}</Card>
    {schedules.length ? <div className="recurring-grid">{schedules.map((schedule) => <ScheduleCard key={schedule.id} schedule={schedule} onEdit={edit} onStatus={status} onHistory={showHistory} />)}</div> : <Card><div className="empty-state">No recurring payment schedules yet.</div></Card>}
    {history && <Card><div className="card-heading"><h3>{history.schedule.title} history</h3><Button variant="ghost" onClick={() => setHistory(null)}>Close</Button></div><div className="recurring-summary"><span><strong>{history.totalRecorded}</strong> recorded occurrences</span><span>Previous payment: {history.previousPaymentDate || 'None'}</span></div>{history.history.length ? <div className="budget-history">{history.history.map((item) => <div className="history-row" key={item.occurrenceDate}><span>{item.occurrenceDate}</span><strong className={`recurring-status-${item.status}`}>{item.status}</strong></div>)}</div> : <div className="empty-state">No occurrences in this schedule yet.</div>}</Card>}
    <Card><p className="card-hint">Due schedules are recorded as normal transactions. Processed means recorded in SmartSpend only; no external payment gateway is connected. Pausing stops future processing, cancelling preserves history, and skipped occurrences are never recreated.</p></Card>
  </div>;
}
