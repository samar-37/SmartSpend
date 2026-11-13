import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { deleteContribution, fetchGoal } from '../features/goals/goalService';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
export default function SavingsGoalDetailPage() {
  const { id } = useParams();
  const [goal, setGoal] = useState(null);
  const [error, setError] = useState('');
  async function load() { try { setGoal(await fetchGoal(id)); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load goal.'); } }
  useEffect(() => { load(); }, [id]);
  async function remove(contribution) { if (!window.confirm('Delete this contribution?')) return; try { setGoal(await deleteContribution(id, contribution.id)); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to delete contribution.'); } }
  if (error) return <Card><p className="form-error" role="alert">{error}</p></Card>;
  if (!goal) return <Card><div className="empty-state">Loading goal...</div></Card>;
  return <div className="page-stack"><div className="page-heading"><div><p className="eyebrow">GOAL DETAIL</p><h2>{goal.name}</h2><p className="page-subtitle">{goal.description || 'Savings goal details and contribution history.'}</p></div><Link className="button button-ghost" to="/savings-goals">Back to goals</Link></div><div className="summary-grid"><Card><p className="card-label">Target</p><p className="summary-amount">{currency.format(Number(goal.targetAmount))}</p></Card><Card><p className="card-label">Current saved</p><p className="summary-amount">{currency.format(Number(goal.currentSaved))}</p></Card><Card><p className="card-label">Remaining</p><p className="summary-amount">{currency.format(Number(goal.remaining))}</p></Card><Card><p className="card-label">Progress</p><p className="summary-amount">{goal.progress}%</p><p className="card-hint">Target date: {goal.targetDate}</p></Card></div><Card><div className="goal-progress"><span style={{ width: `${Math.min(goal.progress, 100)}%` }} /></div><p className="card-hint">{goal.completed ? 'Goal completed.' : `Suggested monthly contribution: ${currency.format(Number(goal.suggestedMonthlyContribution))}${goal.estimatedCompletionDate ? ` · Estimated completion: ${goal.estimatedCompletionDate}` : ''}`}</p></Card><Card><div className="card-heading"><h3>Contribution history</h3><span className="badge">{goal.contributions.length} records</span></div>{goal.contributions.length ? <div className="budget-history">{goal.contributions.map((contribution) => <div className="history-row" key={contribution.id}><span>{contribution.date} · {contribution.note || 'Contribution'}</span><strong>{currency.format(Number(contribution.amount))}<Button variant="ghost" onClick={() => remove(contribution)}>Remove</Button></strong></div>)}</div> : <div className="empty-state">No contributions recorded yet.</div>}</Card></div>;
}
