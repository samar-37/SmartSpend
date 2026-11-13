import api from '../../services/api';

export async function fetchForecast(month) {
  const { data } = await api.get('/forecasts', { params: month ? { month } : {} });
  return data.forecast;
}
