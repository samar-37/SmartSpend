import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import TransactionForm from '../features/transactions/TransactionForm';
import TransactionList from '../features/transactions/TransactionList';
import TransactionDetail from '../features/transactions/TransactionDetail';
import { createTransaction, deleteTransaction, fetchCategories, fetchTransactions, updateTransaction } from '../features/transactions/transactionService';
import { fetchDashboard } from '../features/dashboard/dashboardService';
import { categories as defaultCategories } from '../features/transactions/transactionConstants';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const colors = ['#4f46e5', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#8b5cf6', '#ec4899'];
const currentMonth = new Date().toISOString().slice(0, 7);
const emptyDashboard = {
  totals: { balance: '0.00', income: '0.00', expense: '0.00', savings: '0.00', savingsRate: 0, transactionCount: 0 },
  categoryExpenses: [], dailyExpenses: [], monthlyTrend: [], recentTransactions: [],
};

function monthLabel(value) {
  return new Date(`${value}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth);
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [transactions, setTransactions] = useState({ items: [], pagination: { page: 1, pages: 1, total: 0 } });
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: '', type: '', source: '', category: '', sortBy: 'date', order: 'desc' });
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const [categoryOptions, setCategoryOptions] = useState(defaultCategories);

  const load = useCallback(async () => {
    try { setState('loading'); setError(''); setDashboard(await fetchDashboard(month)); setState('ready'); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load dashboard.'); setState('error'); }
  }, [month]);
  const loadTransactions = useCallback(async () => {
    const result = await fetchTransactions({ ...filters, from: `${month}-01`, to: new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).toISOString().slice(0, 10) });
    setTransactions(result);
  }, [filters, month]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchCategories().then(setCategoryOptions).catch(() => setError('Unable to load categories.')); }, []);
  useEffect(() => { loadTransactions().catch(() => setError('Unable to load transactions.')); }, [loadTransactions]);
  async function refresh() { await Promise.all([load(), loadTransactions()]); }
  function publishBudgetAlerts(result) {
    if (result?.budgetAlerts?.length) window.dispatchEvent(new CustomEvent('budget-alerts-created', { detail: result.budgetAlerts }));
  }
  async function save(values) { const result = editing ? await updateTransaction(editing.id, values) : await createTransaction(values); publishBudgetAlerts(result); setEditing(null); await refresh(); }
  async function remove() { const result = await deleteTransaction(deleting.id); publishBudgetAlerts(result); setDeleting(null); await refresh(); }

  const totals = dashboard.totals;
  const cards = [
    ['Current balance', currency.format(Number(totals.currentBalance)), 'All-time balance'],
    ['Total income', currency.format(Number(totals.allTimeIncome)), 'All recorded income'],
    ['Total expenses', currency.format(Number(totals.allTimeExpense)), 'All recorded expenses'],
    ['Monthly income', currency.format(Number(totals.income)), monthLabel(month)],
    ['Monthly expenses', currency.format(Number(totals.expense)), monthLabel(month)],
    ['Monthly savings', currency.format(Number(totals.savings)), `${totals.savingsRate}% savings rate`],
  ];
  const chartTooltip = (value) => currency.format(Number(value));
  return <div className="page-stack">
    <div className="page-heading"><div><p className="eyebrow">OVERVIEW</p><h2>Good morning</h2><p className="page-subtitle">Here is your financial picture for {monthLabel(month)}.</p></div><div className="dashboard-controls"><label>Viewing month<input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label><Button onClick={() => { setEditing(null); document.getElementById('transaction-form')?.scrollIntoView({ behavior: 'smooth' }); }}>Add transaction</Button></div></div>
    {state === 'error' && <Card><p className="form-error" role="alert">{error}</p><Button variant="ghost" onClick={load}>Try again</Button></Card>}
    {state === 'loading' ? <div className="summary-grid">{[1, 2, 3, 4].map((item) => <Card key={item}><LoadingSkeleton className="skeleton-large" /><LoadingSkeleton /></Card>)}</div> : <div className="summary-grid">{cards.map(([label, amount, hint]) => <Card key={label}><p className="card-label">{label}</p><p className="summary-amount">{amount}</p><p className="card-hint">{hint}</p></Card>)}</div>}
    <div className="chart-grid"><Card><div className="card-heading"><h3>Income vs expenses</h3><span className="badge">{totals.transactionCount} transactions</span></div><div className="chart-box"><ResponsiveContainer><BarChart data={[{ name: monthLabel(month), income: Number(totals.income), expense: Number(totals.expense) }]}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={chartTooltip} /><Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} /><Bar dataKey="expense" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card><Card><div className="card-heading"><h3>Monthly spending trend</h3></div><div className="chart-box">{dashboard.monthlyTrend.length ? <ResponsiveContainer><LineChart data={dashboard.monthlyTrend}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={chartTooltip} /><Line type="monotone" dataKey="income" stroke="#22c55e" name="Income" /><Line type="monotone" dataKey="expense" stroke="#ef4444" name="Expenses" /></LineChart></ResponsiveContainer> : <div className="empty-state">No six-month trend data yet.</div>}</div></Card><Card><div className="card-heading"><h3>Expenses by category</h3></div><div className="chart-box">{dashboard.categoryExpenses.length ? <ResponsiveContainer><PieChart><Pie data={dashboard.categoryExpenses} dataKey="amount" nameKey="name" outerRadius={90} label>{dashboard.categoryExpenses.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={chartTooltip} /></PieChart></ResponsiveContainer> : <div className="empty-state">No expenses in this month.</div>}</div></Card><Card><div className="card-heading"><h3>Daily spending</h3></div><div className="chart-box">{dashboard.dailyExpenses.length ? <ResponsiveContainer><BarChart data={dashboard.dailyExpenses}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={chartTooltip} /><Bar dataKey="amount" fill="#4f46e5" name="Spending" /></BarChart></ResponsiveContainer> : <div className="empty-state">No daily spending data yet.</div>}</div></Card></div>
    <div className="dashboard-sections"><Card><div className="card-heading"><h3>Recent transactions</h3><span className="badge">This month</span></div>{dashboard.recentTransactions.length ? <TransactionList items={dashboard.recentTransactions} pagination={{ page: 1, pages: 1, total: dashboard.recentTransactions.length }} onEdit={setEditing} onDelete={setDeleting} onView={setDetail} /> : <div className="empty-state">No transactions recorded for this month.</div>}</Card><div className="placeholder-grid"><Card><h3>Budget overview</h3><p className="card-hint">Budget management will be connected in a later phase.</p></Card><Card><h3>Upcoming payments</h3><p className="card-hint">Recurring payment data will appear here after that feature is implemented.</p></Card><Card><h3>Savings goals</h3><p className="card-hint">Savings goal progress will appear here after goals are available.</p></Card><Card><h3>Financial insights</h3><p className="card-hint">Insights will be generated from verified financial data in a later phase.</p></Card></div></div>
    <Card><div id="transaction-form" className="card-heading"><h3>{editing ? 'Edit transaction' : 'Add transaction'}</h3></div><TransactionForm transaction={editing} categoryOptions={categoryOptions} onSubmit={save} onCancel={() => setEditing(null)} /></Card>
    <Card><div className="card-heading"><h3>All transactions</h3><span className="badge">{transactions.pagination.total} total</span></div><div className="filters"><input aria-label="Search transactions" placeholder="Search title, notes, or category" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })} /><select aria-label="Filter by type" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value, page: 1 })}><option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option></select><select aria-label="Filter by category" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value, page: 1 })}><option value="">All categories</option>{categoryOptions.map((category) => <option key={typeof category === 'string' ? category : category.name}>{typeof category === 'string' ? category : category.name}</option>)}</select><select aria-label="Filter by payment method" value={filters.paymentMethod || ''} onChange={(event) => setFilters({ ...filters, paymentMethod: event.target.value, page: 1 })}><option value="">All payment methods</option><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="card">Card</option><option value="upi">UPI</option><option value="wallet">Wallet</option><option value="other">Other</option></select><input aria-label="Minimum amount" type="number" min="0" step="0.01" placeholder="Min ₹" value={filters.minAmount || ''} onChange={(event) => setFilters({ ...filters, minAmount: event.target.value, page: 1 })} /><input aria-label="Maximum amount" type="number" min="0" step="0.01" placeholder="Max ₹" value={filters.maxAmount || ''} onChange={(event) => setFilters({ ...filters, maxAmount: event.target.value, page: 1 })} /><input aria-label="From date" type="date" value={filters.from || ''} onChange={(event) => setFilters({ ...filters, from: event.target.value, page: 1 })} /><input aria-label="To date" type="date" value={filters.to || ''} onChange={(event) => setFilters({ ...filters, to: event.target.value, page: 1 })} /><select aria-label="Sort transactions" value={`${filters.sortBy}:${filters.order}`} onChange={(event) => { const [sortBy, order] = event.target.value.split(':'); setFilters({ ...filters, sortBy, order, page: 1 }); }}><option value="date:desc">Newest first</option><option value="date:asc">Oldest first</option><option value="amountMinor:desc">Highest amount</option><option value="amountMinor:asc">Lowest amount</option></select><Button variant="ghost" onClick={() => setFilters({ page: 1, limit: 10, search: '', type: '', category: '', paymentMethod: '', minAmount: '', maxAmount: '', from: '', to: '', sortBy: 'date', order: 'desc' })}>Reset filters</Button></div><TransactionList items={transactions.items} pagination={transactions.pagination} onEdit={setEditing} onDelete={setDeleting} onView={setDetail} onPageChange={(page) => setFilters({ ...filters, page })} /></Card>
    <label className="transaction-source-filter">Transaction source<select aria-label="Filter by source" value={filters.source} onChange={(event) => setFilters({ ...filters, source: event.target.value, page: 1 })}><option value="">All transactions</option><option value="manual">Manual transactions</option><option value="recurring">Recurring transactions</option></select></label>
    {deleting && <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true"><Card><h3>Delete transaction?</h3><p className="card-hint">This will permanently remove “{deleting.title}”.</p><div className="form-actions"><Button variant="danger" onClick={remove}>Delete</Button><Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button></div></Card></div></div>}<TransactionDetail transaction={detail} onClose={() => setDetail(null)} />
  </div>;
}
