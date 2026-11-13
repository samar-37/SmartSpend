import api from '../../services/api';

function download(response, fallbackName) {
  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="([^"]+)"/);
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = match?.[1] || fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadCsv(params) {
  const response = await api.get('/reports/csv', { params, responseType: 'blob' });
  download(response, 'smartspend-transactions.csv');
}

export async function downloadPdf(params) {
  const response = await api.get('/reports/pdf', { params, responseType: 'blob' });
  download(response, 'smartspend-report.pdf');
}
