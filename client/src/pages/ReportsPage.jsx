import { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { fetchCategories } from '../features/transactions/transactionService';
import { downloadCsv, downloadPdf } from '../features/reports/reportService';

export default function ReportsPage() {
  const [filters, setFilters] = useState({ from: '', to: '', type: '', category: '' });
  const [categories, setCategories] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { fetchCategories().then(setCategories).catch(() => setError('Unable to load categories.')); }, []);
  function update(name, value) { setFilters((current) => ({ ...current, [name]: value })); }
  async function exportReport(format) {
    try {
      setBusy(format); setError(''); setMessage('');
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      if (format === 'csv') await downloadCsv(params);
      else await downloadPdf(params);
      setMessage(`${format.toUpperCase()} report downloaded.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Unable to generate ${format.toUpperCase()} report.`);
    } finally { setBusy(''); }
  }
  return <div className="page-stack">
    <div className="page-heading"><div><p className="eyebrow">REPORTING</p><h2>Reports and exports</h2><p className="page-subtitle">Download filtered financial data using server-generated reports.</p></div></div>
    {error && <Card><p className="form-error" role="alert">{error}</p></Card>}{message && <p className="form-success">{message}</p>}
    <Card><div className="card-heading"><h3>Report filters</h3><span className="badge">Applied on the server</span></div><div className="report-filters"><label>From<input type="date" value={filters.from} onChange={(e) => update('from', e.target.value)} /></label><label>To<input type="date" value={filters.to} onChange={(e) => update('to', e.target.value)} /></label><label>Transaction type<select value={filters.type} onChange={(e) => update('type', e.target.value)}><option value="">All transactions</option><option value="income">Income only</option><option value="expense">Expenses only</option></select></label><label>Category<select value={filters.category} onChange={(e) => update('category', e.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select></label></div><div className="form-actions"><Button onClick={() => exportReport('csv')} disabled={Boolean(busy)}>{busy === 'csv' ? 'Preparing CSV...' : 'Download CSV'}</Button><Button variant="ghost" onClick={() => exportReport('pdf')} disabled={Boolean(busy)}>{busy === 'pdf' ? 'Preparing PDF...' : 'Download PDF'}</Button><Button variant="ghost" onClick={() => setFilters({ from: '', to: '', type: '', category: '' })}>Clear filters</Button></div></Card>
    <div className="report-info-grid"><Card><h3>CSV export</h3><p className="card-hint">Exports date, title, type, category, INR amount, payment method, and notes. Values are escaped and formula-prefixed cells are protected.</p></Card><Card><h3>PDF report</h3><p className="card-hint">Includes your name, reporting period, totals, balance, category breakdown, monthly summary, and transaction details.</p></Card></div>
  </div>;
}
