import api from '../../services/api';

export async function fetchBudgets(month) {
  const { data } = await api.get('/budgets', { params: { month } });
  return data.budgets;
}

export async function fetchBudgetHistory() {
  const { data } = await api.get('/budgets/history');
  return data.budgets;
}

export async function createBudget(payload) {
  const { data } = await api.post('/budgets', payload);
  return data.budget;
}

export async function updateBudget(id, payload) {
  const { data } = await api.patch(`/budgets/${id}`, payload);
  return data.budget;
}

export async function deleteBudget(id) {
  await api.delete(`/budgets/${id}`);
}
