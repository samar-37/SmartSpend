import mongoose from 'mongoose';
import Budget from '../models/Budget.js';
import RecurringPayment from '../models/RecurringPayment.js';
import Transaction from '../models/Transaction.js';
import { formatMinorAmount } from '../utils/money.js';

function monthRange(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  return { start, end };
}

function previousMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 2, 1)).toISOString().slice(0, 7);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function money(minor) {
  return Number(formatMinorAmount(minor || 0));
}

function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Number(((current - previous) / previous * 100).toFixed(1));
}

async function monthlyTotals(userId, month) {
  const { start, end } = monthRange(month);
  const groups = await Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: start, $lt: end } } },
    { $group: { _id: '$type', totalMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } },
  ]);
  const totals = { incomeMinor: 0, expenseMinor: 0, incomeCount: 0, expenseCount: 0 };
  groups.forEach((group) => {
    totals[`${group._id}Minor`] = group.totalMinor;
    totals[`${group._id}Count`] = group.count;
  });
  return totals;
}

async function categoriesForMonth(userId, month) {
  const { start, end } = monthRange(month);
  return Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', totalMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } },
    { $sort: { totalMinor: -1 } },
  ]);
}

async function budgetsForMonth(userId, month) {
  const budgets = await Budget.find({ userId, month }).lean();
  const { start, end } = monthRange(month);
  const spending = await Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', totalMinor: { $sum: '$amountMinor' } } },
  ]);
  const byCategory = Object.fromEntries(spending.map((item) => [item._id, item.totalMinor]));
  const overall = spending.reduce((sum, item) => sum + item.totalMinor, 0);
  return budgets.map((budget) => {
    const spentMinor = budget.category ? byCategory[budget.category] || 0 : overall;
    return {
      id: budget._id.toString(),
      category: budget.category || 'Overall',
      amount: money(budget.amountMinor),
      spent: money(spentMinor),
      utilization: budget.amountMinor ? Number((spentMinor / budget.amountMinor * 100).toFixed(1)) : 0,
    };
  });
}

async function unusualSpending(userId, month, previousCategories) {
  const categories = await categoriesForMonth(userId, month);
  const previousByCategory = Object.fromEntries(previousCategories.map((item) => [item._id, item.totalMinor]));
  return categories
    .map((item) => ({
      category: item._id,
      amount: money(item.totalMinor),
      previousAmount: money(previousByCategory[item._id]),
      changePercent: percentChange(item.totalMinor, previousByCategory[item._id] || 0),
      count: item.count,
    }))
    .filter((item) => item.amount >= 100 && item.changePercent >= 50)
    .slice(0, 5);
}

export async function getInsightData(userId, month = currentMonth()) {
  const priorMonth = previousMonth(month);
  const [totals, priorTotals, categories, priorCategories, budgets, recurringPayments] = await Promise.all([
    monthlyTotals(userId, month),
    monthlyTotals(userId, priorMonth),
    categoriesForMonth(userId, month),
    categoriesForMonth(userId, priorMonth),
    budgetsForMonth(userId, month),
    RecurringPayment.find({ userId, status: { $ne: 'cancelled' } }).sort({ amountMinor: -1 }).limit(5).lean(),
  ]);
  const savingsMinor = totals.incomeMinor - totals.expenseMinor;
  const expenseChange = percentChange(totals.expenseMinor, priorTotals.expenseMinor);
  const unusual = await unusualSpending(userId, month, priorCategories);
  const topCategory = categories[0];
  const suggestions = [];
  if (topCategory) suggestions.push({ title: 'Review your largest category', detail: `${topCategory._id} accounts for ${money(topCategory.totalMinor)} of expenses this month.`, fact: { category: topCategory._id, amount: money(topCategory.totalMinor) } });
  if (expenseChange > 0) suggestions.push({ title: 'Compare the increase', detail: `Expenses are ${expenseChange}% higher than ${priorMonth}. Review the categories above their prior-month levels.`, fact: { currentExpense: money(totals.expenseMinor), previousExpense: money(priorTotals.expenseMinor), changePercent: expenseChange } });
  if (savingsMinor < 0) suggestions.push({ title: 'Protect your cash flow', detail: 'Expenses exceeded income this month. Consider pausing non-essential spending until the gap closes.', fact: { savings: money(savingsMinor) } });
  else if (totals.incomeMinor > 0) suggestions.push({ title: 'Keep your savings visible', detail: `${money(savingsMinor)} remains after this month’s recorded expenses.`, fact: { savings: money(savingsMinor), savingsRate: Number((savingsMinor / totals.incomeMinor * 100).toFixed(1)) } });
  const budgetSuggestions = budgets.filter((budget) => budget.utilization >= 75).map((budget) => ({
    category: budget.category,
    utilization: budget.utilization,
    detail: `${budget.category} is at ${budget.utilization}% of its budget (${money(budget.spent * 100)} of ${money(budget.amount * 100)}).`,
  }));
  return {
    month,
    previousMonth: priorMonth,
    monthlySummary: {
      income: money(totals.incomeMinor), expenses: money(totals.expenseMinor), savings: money(savingsMinor),
      savingsRate: totals.incomeMinor ? Number((savingsMinor / totals.incomeMinor * 100).toFixed(1)) : 0,
      transactionCount: totals.incomeCount + totals.expenseCount, expenseChangePercent: expenseChange,
      previousExpenses: money(priorTotals.expenseMinor),
    },
    categories: categories.map((item) => ({ category: item._id, amount: money(item.totalMinor), count: item.count })),
    unusualSpending: unusual,
    budgets,
    budgetSuggestions,
    suggestions,
    recurringPayments: recurringPayments.map((item) => ({ title: item.title, amount: money(item.amountMinor), frequency: item.frequency, category: item.category })),
  };
}

function fact(label, value, detail) {
  return { label, value, detail };
}

export async function answerFinancialQuestion(userId, question, month = currentMonth()) {
  const data = await getInsightData(userId, month);
  const normalized = question.trim().toLowerCase();
  const top = data.categories[0];
  const facts = [];
  let answer;
  if (/(most|highest|biggest).*(spend|expense)|where.*spend/.test(normalized)) {
    answer = top ? `You spent the most in ${top.category} this month.` : 'There are no recorded expenses for this month.';
    if (top) facts.push(fact('Top category', top.category, `${formatMinorAmount(top.amount * 100)} across ${top.count} transactions.`));
  } else if (/(increase|increased|higher|more).*(expense|spend)|why.*expense/.test(normalized)) {
    answer = data.monthlySummary.expenseChangePercent > 0 ? `Expenses increased ${data.monthlySummary.expenseChangePercent}% compared with ${data.previousMonth}.` : `Expenses did not increase compared with ${data.previousMonth}.`;
    facts.push(fact('This month', formatMinorAmount(data.monthlySummary.expenses * 100), `${data.monthlySummary.transactionCount} transactions in ${data.month}.`), fact('Previous month', formatMinorAmount(data.monthlySummary.previousExpenses * 100), `Change: ${data.monthlySummary.expenseChangePercent}%.`));
  } else if (/(save|savings|left over)/.test(normalized)) {
    answer = `You saved ${formatMinorAmount(data.monthlySummary.savings * 100)} this month based on recorded income and expenses.`;
    facts.push(fact('Income', formatMinorAmount(data.monthlySummary.income * 100), 'Recorded income.'), fact('Expenses', formatMinorAmount(data.monthlySummary.expenses * 100), 'Recorded expenses.'), fact('Savings rate', `${data.monthlySummary.savingsRate}%`, 'Savings divided by recorded income.'));
  } else if (/(category).*(reduce|cut)|reduce.*category/.test(normalized)) {
    answer = top ? `${top.category} is the strongest candidate to review because it is your largest expense category.` : 'There is not enough expense data to recommend a category.';
    if (top) facts.push(fact(top.category, formatMinorAmount(top.amount * 100), `${top.count} transactions this month.`));
  } else if (/budget|following/.test(normalized)) {
    const exceeded = data.budgets.filter((budget) => budget.utilization >= 100);
    answer = data.budgets.length ? (exceeded.length ? `${exceeded.length} budget${exceeded.length === 1 ? '' : 's'} exceeded this month.` : 'Your recorded spending is within all configured budgets.') : 'No budgets are configured for this month.';
    data.budgets.slice(0, 5).forEach((budget) => facts.push(fact(budget.category, `${budget.utilization}%`, `${formatMinorAmount(budget.spent * 100)} spent of ${formatMinorAmount(budget.amount * 100)}.`)));
  } else if (/recurring/.test(normalized)) {
    answer = data.recurringPayments.length ? 'These are your largest active recurring payments.' : 'No active recurring payments were found.';
    data.recurringPayments.forEach((payment) => facts.push(fact(payment.title, formatMinorAmount(payment.amount * 100), `${payment.frequency}, ${payment.category}.`)));
  } else if (/unusual|surpris|pattern/.test(normalized)) {
    answer = data.unusualSpending.length ? 'These categories are unusually higher than the prior month.' : 'I did not find a category with a significant increase over the prior month.';
    data.unusualSpending.forEach((item) => facts.push(fact(item.category, `${item.changePercent}% higher`, `${formatMinorAmount(item.amount * 100)} this month versus ${formatMinorAmount(item.previousAmount * 100)} previously.`)));
  } else {
    answer = `For ${data.month}, you recorded ${formatMinorAmount(data.monthlySummary.income * 100)} income and ${formatMinorAmount(data.monthlySummary.expenses * 100)} expenses.`;
    facts.push(fact('Savings', formatMinorAmount(data.monthlySummary.savings * 100), `${data.monthlySummary.savingsRate}% savings rate.`));
  }
  return { question, month, answer, facts, disclaimer: 'These are observations from your recorded transactions, not guaranteed financial advice.' };
}
