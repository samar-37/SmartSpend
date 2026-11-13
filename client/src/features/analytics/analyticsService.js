import api from '../../services/api';

export async function fetchAnalytics(params) {
  const { data } = await api.get('/analytics', { params });
  return data.analytics;
}
