import { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { fetchForecast } from '../features/forecasts/forecastService';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const nextMonth = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)).toISOString().slice(0, 7);

function money(value) { return currency.format(Number(value || 0)); }

export default function ForecastPage() {
  const [month, setMonth] = useState(nextMonth);
  const [forecast, setForecast] = useState(null);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  async function load() {
    try { setState('loading'); setError(''); setForecast(await fetchForecast(month)); setState('ready'); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load forecast.'); setState('error'); }
  }

  useEffect(() => { load(); }, [month]);

  return <div className="page-stack">
    <div className="page-heading"><div><p className="eyebrow">PLANNING</p><h2>Expense forecast</h2><p className="page-subtitle">A statistical estimate based on your recorded history and active recurring schedules.</p></div><div className="forecast-controls"><label>Target month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label><Button variant="ghost" onClick={load}>Refresh</Button></div></div>
    {error && <Card><p className="form-error" role="alert">{error}</p><Button variant="ghost" onClick={load}>Try again</Button></Card>}
    {state === 'loading' && <div className="summary-grid">{[1, 2, 3].map((item) => <Card key={item}><LoadingSkeleton className="skeleton-large" /><LoadingSkeleton /></Card>)}</div>}
    {state === 'ready' && forecast && !forecast.available && <Card><h3>More history is needed</h3><p className="card-hint">{forecast.reason}</p><div className="forecast-requirements"><span>Historical expense months: {forecast.historicalMonths} / {forecast.requirements.minimumHistoricalMonths}</span><span>Expense transactions: {forecast.expenseTransactions} / {forecast.requirements.minimumExpenseTransactions}</span></div></Card>}
    {state === 'ready' && forecast?.available && <><div className="summary-grid">{[['Estimated expenses', money(forecast.monthly.expenses)], ['Expected income', money(forecast.monthly.income)], ['Estimated savings', money(forecast.monthly.savings)]].map(([label, value]) => <Card key={label}><p className="card-label">{label}</p><p className="summary-amount">{value}</p><p className="card-hint">{label === 'Estimated expenses' ? `${money(forecast.monthly.lower)} – ${money(forecast.monthly.upper)} likely range` : 'Prediction, not an actual result'}</p></Card>)}{forecast.actual && <Card><p className="card-label">Actual expenses so far</p><p className="summary-amount">{money(forecast.actual.expenses)}</p><p className="card-hint">Actual recorded data for {forecast.targetMonth}</p></Card>}</div>
      <Card><div className="card-heading"><h3>Forecast explanation</h3><span className="badge">{forecast.historicalMonths} historical months</span></div><p className="card-hint forecast-explanation">{forecast.method} Actuals and predictions are kept separate; the range reflects historical month-to-month variability.</p></Card>
      <div className="insight-grid"><Card><div className="card-heading"><h3>Expected category spending</h3><span className="badge">Prediction</span></div>{forecast.categories.length ? forecast.categories.map((item) => <div className="analytics-row" key={item.category}><span><strong>{item.category}</strong><small>{money(item.lower)} – {money(item.upper)} range</small></span><strong>{money(item.amount)}</strong></div>) : <div className="empty-state">No category history is sufficient.</div>}</Card><Card><div className="card-heading"><h3>Recurring payments</h3></div>{forecast.recurringPayments.items.length ? forecast.recurringPayments.items.map((item) => <div className="analytics-row" key={`${item.title}-${item.category}`}><span><strong>{item.title}</strong><small>{item.category} · {item.occurrences.length} occurrence(s)</small></span><strong>{money(item.amount)}</strong></div>) : <div className="empty-state">No active recurring expenses expected.</div>}<p className="forecast-total">Expected recurring total: <strong>{money(forecast.recurringPayments.total)}</strong></p></Card></div>
      <Card><div className="card-heading"><h3>Month-end budget utilization</h3></div>{forecast.budgetUtilization.length ? forecast.budgetUtilization.map((item) => <div className="forecast-budget" key={item.category}><div className="budget-values"><span>{item.category}</span><strong>{item.utilization}%</strong></div><div className="budget-progress"><span style={{ width: `${Math.min(item.utilization, 100)}%` }} /></div><small>{money(item.forecast)} forecast of {money(item.budget)}</small></div>) : <div className="empty-state">No budgets configured for this target month.</div>}</Card>
      <Card><div className="card-heading"><h3>Forecast accuracy</h3><span className="badge">Historical comparisons</span></div>{forecast.accuracy.length ? <div className="forecast-accuracy">{forecast.accuracy.map((item) => <div className="analytics-row" key={item.targetMonth}><span><strong>{item.targetMonth}</strong><small>Predicted {money(item.predictedExpenses)} · Actual {money(item.actualExpenses)}</small></span><strong>{item.absolutePercentError === null ? 'No actuals' : `${item.absolutePercentError}% error`}</strong></div>)}</div> : <div className="empty-state">Accuracy appears after a saved forecast month has actual transactions.</div>}</Card>
    </>}
  </div>;
}
