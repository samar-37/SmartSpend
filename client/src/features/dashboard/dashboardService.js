import api from '../../services/api';

export async function fetchDashboard(month) {
  const { data } = await api.get('/transactions/dashboard', { params: { month } });
  return data.dashboard;
}
