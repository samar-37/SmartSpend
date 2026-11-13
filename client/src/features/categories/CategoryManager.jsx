import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '../transactions/transactionService';

const initialForm = { name: '', color: '#4f46e5', icon: 'tag' };

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);
  const [replacement, setReplacement] = useState('Other');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try { setCategories(await fetchCategories()); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load categories.'); }
  }
  useEffect(() => { load(); }, []);
  async function save(event) {
    event.preventDefault(); setError(''); setMessage('');
    try {
      if (editing) await updateCategory(editing.id, form);
      else await createCategory(form);
      setForm(initialForm); setEditing(null); setMessage('Category saved.'); await load();
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to save category.'); }
  }
  async function remove(category) {
    if (!window.confirm(`Delete ${category.name}? Existing transactions will be reassigned to the selected category.`)) return;
    try { await deleteCategory(category.id, replacement); setMessage(`${category.name} deleted safely.`); await load(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to delete category.'); }
  }
  const defaults = categories.filter((category) => category.isDefault);
  const custom = categories.filter((category) => !category.isDefault);
  return <Card><div className="card-heading"><div><h3>Categories</h3><p className="card-hint">Default categories are protected. Deleting a custom category reassigns its transactions.</p></div></div>
    <form className="category-form" onSubmit={save}><input aria-label="Category name" placeholder="Category name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><input aria-label="Category color" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} /><input aria-label="Category icon" placeholder="Icon name" value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} /><Button type="submit">{editing ? 'Update category' : 'Add category'}</Button>{editing && <Button type="button" variant="ghost" onClick={() => { setEditing(null); setForm(initialForm); }}>Cancel</Button>}</form>
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success">{message}</p>}
    <div className="category-list"><h4>Default categories</h4>{defaults.map((category) => <div className="category-row" key={category.id}><span className="category-swatch" style={{ backgroundColor: category.color }} />{category.name}<span className="badge">Protected</span></div>)}</div>
    <div className="category-list"><div className="card-heading"><h4>Custom categories</h4><label className="replacement-field">Reassign deleted transactions to<select value={replacement} onChange={(event) => setReplacement(event.target.value)}>{categories.map((category) => <option key={category.id}>{category.name}</option>)}</select></label></div>{custom.length ? custom.map((category) => <div className="category-row" key={category.id}><span className="category-swatch" style={{ backgroundColor: category.color }} />{category.name}<span className="category-row-actions"><Button variant="ghost" onClick={() => { setEditing(category); setForm({ name: category.name, color: category.color, icon: category.icon }); }}>Edit</Button><Button variant="ghost" onClick={() => remove(category)}>Delete</Button></span></div>) : <p className="card-hint">No custom categories yet.</p>}</div>
  </Card>;
}
