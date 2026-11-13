import api from '../../services/api';

export async function fetchInsightSummary(month) {
  const { data } = await api.get('/insights/summary', { params: month ? { month } : {} });
  return data.insights;
}

export async function askFinancialQuestion(question, month) {
  const { data } = await api.post('/insights/ask', { question, ...(month ? { month } : {}) });
  return data.response;
}
