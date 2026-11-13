import { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { askFinancialQuestion, fetchInsightSummary } from '../features/insights/insightService';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const suggestions = ['Where did I spend the most money?', 'Why did my expenses increase?', 'How much did I save this month?', 'Am I following my budget?', 'What are my biggest recurring payments?'];
const currentMonth = new Date().toISOString().slice(0, 7);

function money(value) { return currency.format(Number(value || 0)); }

export default function InsightsPage() {
  const [month, setMonth] = useState(currentMonth);
  const [insights, setInsights] = useState(null);
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  async function load() {
    try { setState('loading'); setError(''); setInsights(await fetchInsightSummary(month)); setState('ready'); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load financial insights.'); setState('error'); }
  }

  useEffect(() => { load(); }, [month]);

  async function ask(value = question) {
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      setError('');
      setQuestion('');
      const response = await askFinancialQuestion(trimmed, month);
      setHistory((current) => [...current, response]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to answer that question.');
    }
  }

  return <div className="page-stack">
    <div className="page-heading"><div><p className="eyebrow">ASSISTANT</p><h2>Financial insights</h2><p className="page-subtitle">Grounded explanations from your recorded financial data.</p></div><label className="insight-month">Month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label></div>
    {error && <Card><p className="form-error" role="alert">{error}</p><Button variant="ghost" onClick={load}>Try again</Button></Card>}
    {state === 'loading' ? <div className="summary-grid">{[1, 2, 3, 4].map((item) => <Card key={item}><LoadingSkeleton className="skeleton-large" /><LoadingSkeleton /></Card>)}</div> : insights && <><div className="summary-grid">{[['Income', insights.monthlySummary.income], ['Expenses', insights.monthlySummary.expenses], ['Savings', insights.monthlySummary.savings], ['Savings rate', `${insights.monthlySummary.savingsRate}%`]].map(([label, value]) => <Card key={label}><p className="card-label">{label}</p><p className="summary-amount">{typeof value === 'string' ? value : money(value)}</p><p className="card-hint">{insights.monthlySummary.transactionCount} recorded transactions</p></Card>)}</div>
      <div className="insight-grid"><Card><div className="card-heading"><h3>Spending analysis</h3></div>{insights.categories.length ? insights.categories.slice(0, 5).map((item) => <div className="analytics-row" key={item.category}><span><strong>{item.category}</strong><small>{item.count} transactions</small></span><strong>{money(item.amount)}</strong></div>) : <div className="empty-state">No expense data for this month.</div>}</Card><Card><div className="card-heading"><h3>Unusual spending</h3></div>{insights.unusualSpending.length ? insights.unusualSpending.map((item) => <div className="analytics-row" key={item.category}><span><strong>{item.category}</strong><small>{item.changePercent}% above prior month</small></span><strong>{money(item.amount)}</strong></div>) : <div className="empty-state">No significant category increases found.</div>}</Card></div>
      <div className="insight-grid"><Card><div className="card-heading"><h3>Saving suggestions</h3></div>{insights.suggestions.length ? <div className="insight-list">{insights.suggestions.map((item) => <div className="insight-item" key={item.title}><strong>{item.title}</strong><p className="card-hint">{item.detail}</p></div>)}</div> : <div className="empty-state">Record more transactions to receive suggestions.</div>}</Card><Card><div className="card-heading"><h3>Budget suggestions</h3></div>{insights.budgetSuggestions.length ? insights.budgetSuggestions.map((item) => <div className="analytics-row" key={item.category}><span>{item.category}</span><strong>{item.utilization}% used</strong></div>) : <div className="empty-state">No budgets need attention.</div>}</Card></div>
      <Card><div className="card-heading"><h3>Ask about your finances</h3><span className="badge">Facts only</span></div><div className="question-suggestions">{suggestions.map((item) => <Button variant="ghost" key={item} onClick={() => ask(item)}>{item}</Button>)}</div><form className="insight-question" onSubmit={(event) => { event.preventDefault(); ask(); }}><input aria-label="Ask a financial question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about your recorded transactions..." /><Button type="submit">Ask</Button></form>{history.length > 0 && <div className="insight-history">{history.map((item, index) => <div className="insight-answer" key={`${item.question}-${index}`}><p className="card-label">{item.question}</p><p>{item.answer}</p><div className="fact-list">{item.facts.map((fact) => <div className="fact-row" key={`${fact.label}-${fact.value}`}><strong>{fact.label}: {fact.value}</strong><small>{fact.detail}</small></div>)}</div><small className="card-hint">{item.disclaimer}</small></div>)}</div>}</Card>
    </>}
  </div>;
}
