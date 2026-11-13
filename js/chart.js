import { formatCurrency } from './utils.js';

let pieChart = null, barChart = null;

export function renderChartsForUser(user, pieEl, barEl){
  const transactions = (user.transactions || []);
  const income = transactions.filter(t=>t.type==='income').reduce((s,t)=>s + Number(t.amount), 0);
  const expense = transactions.filter(t=>t.type==='expense').reduce((s,t)=>s + Number(t.amount), 0);

  // pie
  const ctxPie = pieEl.getContext('2d');
  if(pieChart) pieChart.destroy();
  pieChart = new Chart(ctxPie, {
    type: 'doughnut',
    data: {
      labels: ['Income','Expense'],
      datasets: [{ data: [income, expense], backgroundColor: ['#00c853','#ff1744'] }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });

  // bar by category (last 6 months)
  const categories = [...new Set(transactions.map(t=>t.category || 'Other'))];
  const catSums = categories.map(c => transactions.filter(t=>t.category===c).reduce((s,t)=>s+Number(t.amount),0));
  const ctxBar = barEl.getContext('2d');
  if(barChart) barChart.destroy();
  barChart = new Chart(ctxBar, {
    type: 'bar',
    data: { labels: categories, datasets: [{ label: 'Total by Category', data: catSums, backgroundColor: '#0099ff' }] },
    options: { indexAxis: 'x', plugins:{ legend:{ display:false } } }
  });
}