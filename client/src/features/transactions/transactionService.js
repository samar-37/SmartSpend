import api from '../../services/api';

export async function fetchTransactions(params) {
  const { data } = await api.get('/transactions', { params });
  return data;
}

export async function fetchSummary() {
  const { data } = await api.get('/transactions/summary');
  return data.summary;
}

export async function createTransaction(payload) {
  const { data } = await api.post('/transactions', payload);
  return data;
}

export async function updateTransaction(id, payload) {
  const { data } = await api.patch(`/transactions/${id}`, payload);
  return data;
}

export async function deleteTransaction(id) {
  const { data } = await api.delete(`/transactions/${id}`);
  return data;
}

export async function fetchCategories() {
  const { data } = await api.get('/categories');
  return data.categories;
}

export async function createCategory(payload) {
  const { data } = await api.post('/categories', payload);
  return data.category;
}

export async function updateCategory(id, payload) {
  const { data } = await api.patch(`/categories/${id}`, payload);
  return data.category;
}

export async function deleteCategory(id, replacementCategory = 'Other') {
  await api.delete(`/categories/${id}`, { params: { replacementCategory } });
}
