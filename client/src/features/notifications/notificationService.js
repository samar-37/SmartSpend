import api from '../../services/api';

export async function fetchNotifications(params = {}) {
  const { data } = await api.get('/notifications', { params });
  return data;
}

export async function fetchActiveBudgetAlerts() {
  const { data } = await api.get('/notifications/budget-alerts');
  return data.alerts;
}

export async function markNotificationRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data.notification;
}

export async function markAllNotificationsRead() {
  await api.post('/notifications/read-all');
}

export async function deleteNotification(id) {
  await api.delete(`/notifications/${id}`);
}

export async function fetchNotificationPreferences() {
  const { data } = await api.get('/notifications/preferences');
  return data.preferences;
}

export async function updateNotificationPreferences(preferences) {
  const allowedFields = ['consentGranted', 'recurringPayment', 'budgetWarning', 'budgetWarning75', 'budgetWarning90', 'budgetExceeded', 'savingsMilestone', 'monthlySummary', 'accountEvent'];
  const payload = Object.fromEntries(allowedFields.filter((field) => preferences[field] !== undefined).map((field) => [field, preferences[field]]));
  const { data } = await api.patch('/notifications/preferences', payload);
  return data;
}
