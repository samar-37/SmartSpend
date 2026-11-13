import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import { categories, paymentMethods } from './transactionConstants';

const empty = { title: '', amount: '', type: 'expense', category: 'Food', date: new Date().toISOString().slice(0, 10), paymentMethod: 'upi', notes: '' };

export default function TransactionForm({ transaction, onSubmit, onCancel, categoryOptions = categories }) {
  const [values, setValues] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction) setValues({ ...transaction, amount: transaction.amount, date: transaction.date });
    else setValues(empty);
  }, [transaction]);

  function update(event) { setValues((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setError('');
    if (!values.title.trim() || !values.amount || Number(values.amount) <= 0) return setError('Enter a title and a positive amount.');
    setSaving(true);
    try { await onSubmit(values); if (!transaction) setValues(empty); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to save transaction.'); }
    finally { setSaving(false); }
  }
  return <form className="transaction-form" onSubmit={submit}>
    <div className="form-grid">
      <label>Title<input name="title" value={values.title} onChange={update} placeholder="e.g. Monthly salary" /></label>
      <label>Amount (₹)<input name="amount" type="number" min="0.01" step="0.01" value={values.amount} onChange={update} placeholder="0.00" /></label>
      <label>Type<select name="type" value={values.type} onChange={update}><option value="expense">Expense</option><option value="income">Income</option></select></label>
      <label>Category<select name="category" value={values.category} onChange={update}>{categoryOptions.map((category) => <option key={typeof category === 'string' ? category : category.name}>{typeof category === 'string' ? category : category.name}</option>)}</select></label>
      <label>Date<input name="date" type="date" value={values.date} onChange={update} /></label>
      <label>Payment method<select name="paymentMethod" value={values.paymentMethod} onChange={update}>{paymentMethods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    <label>Notes<textarea name="notes" value={values.notes} onChange={update} placeholder="Optional notes" rows="3" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : transaction ? 'Update transaction' : 'Add transaction'}</Button>{transaction && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}</div>
  </form>;
}
