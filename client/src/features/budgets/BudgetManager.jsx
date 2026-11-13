import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { fetchCategories } from '../transactions/transactionService';
import { createBudget, deleteBudget, fetchBudgetHistory, fetchBudgets, updateBudget } from './budgetService';

const currentMonth = new Date().toISOString().slice(0, 7);
const emptyForm = { month: currentMonth, category: '', amount: '', warningThresholds: [75, 90, 100] };
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

function BudgetCard({ budget, onEdit, onDelete }) {
  const progress = Math.min(budget.utilization, 100);
  return <article className={`budget-card budget-${budget.warningLevel}`}>
    <div className="card-heading"><div><h3>{budget.category || 'Overall budget'}</h3><p className="card-hint">{budget.month}</p></div><span className="budget-status">{budget.warningLevel}</span></div>
    <div className="budget-values"><strong>{currency.format(Number(budget.spent))}</strong><span>of {currency.format(Number(budget.amount))}</span></div>
    <div className="budget-progress"><span style={{ width: `${progress}%` }} /></div>
    <div className="budget-meta"><span>{budget.utilization}% used</span><span className={budget.remainingMinor < 0 ? 'form-error' : ''}>{currency.format(Number(budget.remaining))} remaining</span></div>
    <div className="form-actions"><Button variant="ghost" onClick={() => onEdit(budget)}>Edit</Button><Button variant="ghost" onClick={() => onDelete(budget)}>Delete</Button></div>
  </article>;
}

export default function BudgetManager() {
  const [month, setMonth] = useState(currentMonth);
  const [budgets, setBudgets] = useState([]);
  const [history, setHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try {
      setError('');
      const [current, past, availableCategories] = await Promise.all([fetchBudgets(month), fetchBudgetHistory(), fetchCategories()]);
      setBudgets(current); setHistory(past); setCategories(availableCategories);
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load budgets.'); }
  }
  useEffect(() => { load(); }, [month]);
  function startEdit(budget) {
    setEditing(budget); setShowForm(true);
    setForm({ month: budget.month, category: budget.category || '', amount: budget.amount, warningThresholds: budget.warningThresholds });
  }
  async function save(event) {
    event.preventDefault(); setError(''); setMessage('');
    try {
      if (editing) await updateBudget(editing.id, { amount: form.amount, warningThresholds: form.warningThresholds });
      else await createBudget({ ...form, category: form.category || null });
      setForm({ ...emptyForm, month }); setEditing(null); setShowForm(false); setMessage('Budget saved.'); await load();
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to save budget.'); }
  }
  async function remove(budget) {
    if (!window.confirm(`Delete ${budget.category || 'overall'} budget for ${budget.month}?`)) return;
    try { await deleteBudget(budget.id); setMessage('Budget deleted.'); await load(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to delete budget.'); }
  }
  return <div className="page-stack">
    <div className="page-heading"><div><p className="eyebrow">PLANNING</p><h2>Budgets</h2><p className="page-subtitle">Plan spending and monitor real expense utilization.</p></div><div className="dashboard-controls"><label>Budget month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label><Button onClick={() => { setEditing(null); setForm({ ...emptyForm, month }); setShowForm(true); }}>Create budget</Button></div></div>
    {error && <Card><p className="form-error" role="alert">{error}</p></Card>}{message && <p className="form-success">{message}</p>}
    {showForm && <Card><div className="card-heading"><h3>{editing ? 'Edit budget' : 'Create budget'}</h3><Button variant="ghost" onClick={() => setShowForm(false)}>Close</Button></div><form className="budget-form" onSubmit={save}><label>Month<input type="month" value={form.month} disabled={Boolean(editing)} onChange={(event) => setForm({ ...form, month: event.target.value })} /></label><label>Category<select value={form.category} disabled={Boolean(editing)} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="">Overall budget</option>{categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select></label><label>Allocated amount (₹)<input type="number" min="0.01" step="0.01" required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label><div className="threshold-fields"><span>Warning thresholds (%)</span>{form.warningThresholds.map((threshold, index) => <input key={index} type="number" min="1" max="100" value={threshold} onChange={(event) => { const values = [...form.warningThresholds]; values[index] = Number(event.target.value); setForm({ ...form, warningThresholds: values }); }} />)}</div><Button type="submit">{editing ? 'Update budget' : 'Save budget'}</Button></form></Card>}
    {budgets.length ? <div className="budget-grid">{budgets.map((budget) => <BudgetCard key={budget.id} budget={budget} onEdit={startEdit} onDelete={remove} />)}</div> : <Card><div className="empty-state">No budgets for {month}. Create an overall or category budget to start tracking.</div></Card>}
    <Card><div className="card-heading"><h3>Budget history</h3><span className="badge">{history.length} records</span></div>{history.length ? <div className="budget-history">{history.map((budget) => <div className="history-row" key={budget.id}><span>{budget.month} · {budget.category || 'Overall'}</span><span>{currency.format(Number(budget.spent))} / {currency.format(Number(budget.amount))}</span><strong>{budget.utilization}%</strong></div>)}</div> : <div className="empty-state">Historical budget comparisons will appear after budgets are created.</div>}</Card>
    <Card><p className="card-hint">Budget spending counts only expense transactions dated within the budget month. Income is never counted as spending. Deleted transactions stop contributing immediately; transactions in another month do not affect this budget. Transfers and refunds are not separate transaction types yet, so they follow the existing transaction type selected by the user.</p></Card>
  </div>;
}
