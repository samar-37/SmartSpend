import api from '../../services/api';

export async function fetchGoals() {
  const { data } = await api.get('/savings-goals');
  return data.goals;
}

export async function fetchGoal(id) {
  const { data } = await api.get(`/savings-goals/${id}`);
  return data.goal;
}

export async function createGoal(payload) {
  const { data } = await api.post('/savings-goals', payload);
  return data.goal;
}

export async function updateGoal(id, payload) {
  const { data } = await api.patch(`/savings-goals/${id}`, payload);
  return data.goal;
}

export async function deleteGoal(id) {
  await api.delete(`/savings-goals/${id}`);
}

export async function addContribution(id, payload) {
  const { data } = await api.post(`/savings-goals/${id}/contributions`, payload);
  return data.goal;
}

export async function deleteContribution(goalId, contributionId) {
  const { data } = await api.delete(`/savings-goals/${goalId}/contributions/${contributionId}`);
  return data.goal;
}
