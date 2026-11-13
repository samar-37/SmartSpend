import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { formatMinorAmount } from '../utils/money.js';

function buildFilter(userId, query) {
  const filter = { userId: new mongoose.Types.ObjectId(userId) };
  if (query.type) filter.type = query.type;
  if (query.source === 'recurring') filter.recurringPaymentId = { $exists: true };
  if (query.source === 'manual') filter.recurringPaymentId = { $exists: false };
  if (query.category) filter.category = query.category;
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) filter.date.$lt = new Date(new Date(`${query.to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000);
  }
  return filter;
}

function period(query) {
  return query.from || query.to ? `${query.from || 'Beginning'} to ${query.to || 'Present'}` : 'All recorded transactions';
}

function safeCsv(value) {
  const text = String(value ?? '');
  const escaped = text.replaceAll('"', '""');
  return /^[=+\-@]/.test(text.trimStart()) ? `"'${escaped.replace(/^'/, '')}"` : `"${escaped}"`;
}

function formatDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export async function getReportData(userId, query) {
  const filter = buildFilter(userId, query);
  const [user, totals, categories, months] = await Promise.all([
    User.findById(userId).select('name').lean(),
    Transaction.aggregate([{ $match: filter }, { $group: { _id: '$type', totalMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } }]),
    Transaction.aggregate([{ $match: { ...filter, type: 'expense' } }, { $group: { _id: '$category', totalMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } }, { $sort: { totalMinor: -1 } }]),
    Transaction.aggregate([{ $match: filter }, { $group: { _id: { month: { $dateToString: { format: '%Y-%m', date: '$date', timezone: 'UTC' } }, type: '$type' }, totalMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } }, { $sort: { '_id.month': 1 } }]),
  ]);
  const values = { incomeMinor: 0, expenseMinor: 0, incomeCount: 0, expenseCount: 0 };
  totals.forEach((item) => { values[`${item._id}Minor`] = item.totalMinor; values[`${item._id}Count`] = item.count; });
  return {
    userName: user?.name || 'SmartSpend user',
    period: period(query),
    filter,
    totals: {
      income: formatMinorAmount(values.incomeMinor), expenses: formatMinorAmount(values.expenseMinor),
      balance: formatMinorAmount(values.incomeMinor - values.expenseMinor),
      incomeCount: values.incomeCount, expenseCount: values.expenseCount,
    },
    categories: categories.map((item) => ({ name: item._id, amount: formatMinorAmount(item.totalMinor), count: item.count })),
    months: months.reduce((result, item) => {
      const month = result.find((entry) => entry.month === item._id.month) || { month: item._id.month, income: '0.00', expenses: '0.00' };
      month[item._id.type === 'income' ? 'income' : 'expenses'] = formatMinorAmount(item.totalMinor);
      if (!result.includes(month)) result.push(month);
      return result;
    }, []),
  };
}

export async function streamCsv(userId, query, response) {
  const report = await getReportData(userId, query);
  const filename = `smartspend-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  response.write('\uFEFF');
  response.write(['Date', 'Title', 'Type', 'Category', 'Amount (INR)', 'Payment method', 'Source', 'Notes'].map(safeCsv).join(',') + '\r\n');
  const cursor = Transaction.find(report.filter).sort({ date: 1, _id: 1 }).lean().cursor();
  for await (const transaction of cursor) {
    response.write([
      formatDate(transaction.date), transaction.title, transaction.type, transaction.category,
      formatMinorAmount(transaction.amountMinor), transaction.paymentMethod, transaction.recurringPaymentId ? 'Recurring' : 'Manual', transaction.notes,
    ].map(safeCsv).join(',') + '\r\n');
  }
  response.end();
}

function pdfText(document, text, options = {}) {
  document.text(String(text ?? ''), options);
}

export async function streamPdf(userId, query, response) {
  const report = await getReportData(userId, query);
  const filename = `smartspend-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  response.setHeader('Content-Type', 'application/pdf');
  response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const document = new PDFDocument({ margin: 48, size: 'A4' });
  document.pipe(response);
  document.fontSize(20).fillColor('#1e293b').text('SmartSpend Financial Report');
  document.moveDown(.4).fontSize(10).fillColor('#64748b');
  pdfText(document, `Prepared for ${report.userName}`);
  pdfText(document, `Reporting period: ${report.period}`);
  document.moveDown().fontSize(13).fillColor('#1e293b').text('Summary');
  document.fontSize(10).fillColor('#334155');
  pdfText(document, `Total income: INR ${report.totals.income}`);
  pdfText(document, `Total expenses: INR ${report.totals.expenses}`);
  pdfText(document, `Balance: INR ${report.totals.balance}`);
  pdfText(document, `Income transactions: ${report.totals.incomeCount} | Expense transactions: ${report.totals.expenseCount}`);
  document.moveDown().fontSize(13).fillColor('#1e293b').text('Category breakdown');
  document.fontSize(10).fillColor('#334155');
  report.categories.length ? report.categories.forEach((item) => pdfText(document, `${item.name}: INR ${item.amount} (${item.count} transactions)`)) : pdfText(document, 'No expense categories in this report.');
  if (report.categories.length) {
    document.moveDown(.4).fontSize(11).fillColor('#1e293b').text('Category chart');
    const maximum = Math.max(...report.categories.map((item) => Number(item.amount)), 1);
    report.categories.slice(0, 8).forEach((item) => {
      const width = Math.max(2, 220 * Number(item.amount) / maximum);
      document.fontSize(8).fillColor('#334155').text(item.name, { continued: true, width: 90 });
      document.fillColor('#4f46e5').rect(145, document.y - 9, width, 8).fill();
      document.fillColor('#334155').text(` INR ${item.amount}`, { continued: false });
    });
  }
  document.moveDown().fontSize(13).fillColor('#1e293b').text('Monthly summary');
  document.fontSize(10).fillColor('#334155');
  report.months.length ? report.months.forEach((item) => pdfText(document, `${item.month}: income INR ${item.income} | expenses INR ${item.expenses}`)) : pdfText(document, 'No monthly data in this report.');
  document.addPage().fontSize(13).fillColor('#1e293b').text('Transaction details');
  document.moveDown(.5).fontSize(9).fillColor('#334155');
  pdfText(document, 'Date | Type | Category | Amount | Source | Title');
  const cursor = Transaction.find(report.filter).sort({ date: 1, _id: 1 }).lean().cursor();
  let count = 0;
  for await (const transaction of cursor) {
    if (count && count % 36 === 0) document.addPage().fontSize(9);
    pdfText(document, `${formatDate(transaction.date)} | ${transaction.type} | ${transaction.category} | INR ${formatMinorAmount(transaction.amountMinor)} | ${transaction.recurringPaymentId ? 'Recurring' : 'Manual'} | ${transaction.title}`);
    count += 1;
  }
  if (!count) pdfText(document, 'No transactions match the selected filters.');
  document.end();
}
