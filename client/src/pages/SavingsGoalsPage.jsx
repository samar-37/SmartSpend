import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { addContribution, createGoal, deleteContribution, deleteGoal, fetchGoals, updateGoal } from '../features/goals/goalService';

const today = new Date().toISOString().slice(0, 10);
const emptyGoal = { name: '', targetAmount: '', targetDate: today, description: '' };
const emptyContribution = { amount: '', date: today, note: '' };
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
function money(value) { return currency.format(Number(value || 0)); }

function GoalCard({ goal, onEdit, onDelete, onContribute }) {
  return <article className={`goal-card ${goal.completed ? 'goal-complete' : ''}`}>
    <div className="card-heading"><div><h3>{goal.name}</h3><p className="card-hint">Target {money(goal.targetAmount)} by {goal.targetDate}</p></div><span className={`badge ${goal.completed ? 'status-success' : ''}`}>{goal.completed ? 'Completed' : `${goal.progress}%`}</span></div>
    <p className="goal-description">{goal.description || 'No description provided.'}</p>
    <div className="goal-progress"><span style={{ width: `${Math.min(goal.progress, 100)}%` }} /></div>
    <div className="goal-values"><strong>{money(goal.currentSaved)}</strong><span>{money(goal.remaining)} remaining</span></div>
    <p className="card-hint">{goal.completed ? 'Target reached.' : `Suggested monthly contribution: ${money(goal.suggestedMonthlyContribution)}${goal.estimatedCompletionDate ? ` · estimated completion ${goal.estimatedCompletionDate}` : ''}`}</p>
    <div className="form-actions"><Link className="button button-ghost" to={`/savings-goals/${goal.id}`}>Details</Link><Button variant="ghost" onClick={() => onContribute(goal)}>Add contribution</Button><Button variant="ghost" onClick={() => onEdit(goal)}>Edit</Button><Button variant="ghost" onClick={() => onDelete(goal)}>Delete</Button></div>
  </article>;
}

export default function SavingsGoalsPage() {
  const [goals, setGoals] = useState([]);
  const [goalForm, setGoalForm] = useState(emptyGoal);
  const [contributionForm, setContributionForm] = useState(emptyContribution);
  const [editing, setEditing] = useState(null);
  const [contributing, setContributing] = useState(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() { try { setError(''); setGoals(await fetchGoals()); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load savings goals.'); } }
  useEffect(() => { load(); }, []);
  function edit(goal) { setEditing(goal); setGoalForm({ name: goal.name, targetAmount: goal.targetAmount, targetDate: goal.targetDate, description: goal.description }); setShowGoalForm(true); }
  async function saveGoal(event) { event.preventDefault(); try { if (editing) await updateGoal(editing.id, goalForm); else await createGoal(goalForm); setShowGoalForm(false); setEditing(null); setGoalForm(emptyGoal); setMessage('Savings goal saved.'); await load(); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to save savings goal.'); } }
  async function saveContribution(event) { event.preventDefault(); try { await addContribution(contributing.id, contributionForm); setContributing(null); setContributionForm(emptyContribution); setMessage('Contribution recorded.'); await load(); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to record contribution.'); } }
  async function remove(goal) { if (!window.confirm(`Delete ${goal.name}? Contribution history will also be deleted.`)) return; try { await deleteGoal(goal.id); setMessage('Savings goal deleted.'); await load(); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to delete savings goal.'); } }
  return <div className="page-stack">
    <div className="page-heading"><div><p className="eyebrow">PLANNING</p><h2>Savings goals</h2><p className="page-subtitle">Track intentional savings separately from ordinary income and expenses.</p></div><Button onClick={() => { setEditing(null); setGoalForm(emptyGoal); setShowGoalForm(true); }}>Create goal</Button></div>
    {error && <Card><p className="form-error" role="alert">{error}</p></Card>}{message && <p className="form-success">{message}</p>}
    {showGoalForm && <Card><div className="card-heading"><h3>{editing ? 'Edit savings goal' : 'New savings goal'}</h3><Button variant="ghost" onClick={() => setShowGoalForm(false)}>Close</Button></div><form className="transaction-form" onSubmit={saveGoal}><div className="form-grid"><label>Goal name<input required value={goalForm.name} onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })} placeholder="Emergency fund" /></label><label>Target amount (₹)<input required type="number" min="0.01" step="0.01" value={goalForm.targetAmount} onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })} /></label><label>Target date<input required type="date" value={goalForm.targetDate} onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })} /></label></div><label>Description<textarea rows="3" value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} /></label><Button type="submit">{editing ? 'Update goal' : 'Save goal'}</Button></form></Card>}
    {contributing && <Card><div className="card-heading"><h3>Add contribution to {contributing.name}</h3><Button variant="ghost" onClick={() => setContributing(null)}>Close</Button></div><form className="transaction-form" onSubmit={saveContribution}><div className="form-grid"><label>Amount (₹)<input required type="number" min="0.01" step="0.01" value={contributionForm.amount} onChange={(e) => setContributionForm({ ...contributionForm, amount: e.target.value })} /></label><label>Date<input required type="date" value={contributionForm.date} onChange={(e) => setContributionForm({ ...contributionForm, date: e.target.value })} /></label></div><label>Note<textarea rows="2" value={contributionForm.note} onChange={(e) => setContributionForm({ ...contributionForm, note: e.target.value })} /></label><Button type="submit">Record contribution</Button></form></Card>}
    {goals.length ? <div className="goal-grid">{goals.map((goal) => <GoalCard key={goal.id} goal={goal} onEdit={edit} onDelete={remove} onContribute={(goalToFund) => { setContributing(goalToFund); setContributionForm(emptyContribution); }} />)}</div> : <Card><div className="empty-state">No savings goals yet. Create one to start tracking intentional savings.</div></Card>}
    <Card><p className="card-hint">Contributions are stored separately from transactions and do not change income, expense, balance, or budget totals. A goal is completed when recorded contributions reach its target amount.</p></Card>
  </div>;
}
