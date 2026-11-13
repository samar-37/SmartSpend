import api from '../../services/api';

export async function fetchRecurringPayments() {
  const { data } = await api.get('/recurring-payments');
  return data.schedules;
}

export async function fetchUpcomingPayments() {
  const { data } = await api.get('/recurring-payments/upcoming');
  return data.upcoming;
}

export async function createRecurringPayment(payload) {
  const { data } = await api.post('/recurring-payments', payload);
  return data.schedule;
}

export async function updateRecurringPayment(id, payload) {
  const { data } = await api.patch(`/recurring-payments/${id}`, payload);
  return data.schedule;
}

export async function changeRecurringStatus(id, action) {
  const { data } = await api.post(`/recurring-payments/${id}/${action}`);
  return data.schedule;
}

export async function fetchRecurringHistory(id) {
  const { data } = await api.get(`/recurring-payments/${id}/history`);
  return data;
}

export async function recordRecurringOccurrence(id, date) {
  const { data } = await api.post(`/recurring-payments/${id}/occurrences/${date}`);
  return data;
}

export async function skipRecurringOccurrence(id, date) {
  const { data } = await api.post(`/recurring-payments/${id}/occurrences/${date}/skip`);
  return data;
}
