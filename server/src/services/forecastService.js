import mongoose from 'mongoose';
import Budget from '../models/Budget.js';
import ForecastSnapshot from '../models/ForecastSnapshot.js';
import RecurringPayment from '../models/RecurringPayment.js';
import Transaction from '../models/Transaction.js';
import { formatMinorAmount } from '../utils/money.js';
import { dateKey, occurrenceDates } from '../utils/recurrence.js';

const HISTORY_MONTHS = 6;
const MIN_HISTORY_MONTHS = 3;
const MIN_EXPENSE_TRANSACTIONS = 5;
const DAY = 24 * 60 * 60 * 1000;

function monthRange(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return { start: new Date(Date.UTC(year, monthNumber - 1, 1)), end: new Date(Date.UTC(year, monthNumber, 1)) };
}

function shiftMonth(month, offset) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + offset, 1)).toISOString().slice(0, 7);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function money(minor) {
  return Number(formatMinorAmount(minor || 0));
}

function weightedMean(values) {
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  return totalWeight ? values.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight : 0;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1));
}

function range(values, center = values.length ? values[values.length - 1] : 0) {
  const deviation = standardDeviation(values);
  return { lower: Math.max(0, center - deviation), upper: center + deviation };
}

async function historicalData(userId, targetMonth) {
  const start = monthRange(shiftMonth(targetMonth, -HISTORY_MONTHS)).start;
  const end = monthRange(targetMonth).start;
  const match = { userId: new mongoose.Types.ObjectId(userId), date: { $gte: start, $lt: end } };
  const [monthly, categories, transactionCount] = await Promise.all([
    Transaction.aggregate([{ $match: match }, { $group: { _id: { month: { $dateToString: { format: '%Y-%m', date: '$date', timezone: 'UTC' } }, type: '$type' }, totalMinor: { $sum: '$amountMinor' } } }]),
    Transaction.aggregate([{ $match: { ...match, type: 'expense' } }, { $group: { _id: { month: { $dateToString: { format: '%Y-%m', date: '$date', timezone: 'UTC' } }, category: '$category' }, totalMinor: { $sum: '$amountMinor' } } }]),
    Transaction.countDocuments({ ...match, type: 'expense' }),
  ]);
  const months = Array.from({ length: HISTORY_MONTHS }, (_, index) => shiftMonth(targetMonth, index - HISTORY_MONTHS));
  const monthlyValues = Object.fromEntries(months.map((month) => [month, { expense: 0, income: 0 }]));
  monthly.forEach((item) => { monthlyValues[item._id.month][item._id.type] = item.totalMinor; });
  const categoryValues = {};
  categories.forEach((item) => {
    categoryValues[item._id.category] ||= {};
    categoryValues[item._id.category][item._id.month] = item.totalMinor;
  });
  return { months, monthlyValues, categoryValues, transactionCount };
}

async function recurringForecast(userId, targetMonth) {
  const { start, end } = monthRange(targetMonth);
  const schedules = await RecurringPayment.find({ userId, status: 'active', type: 'expense' }).lean();
  const items = [];
  for (const schedule of schedules) {
    const occurrences = occurrenceDates(schedule, new Date(end.getTime() - DAY)).filter((date) => date >= start && date < end);
    if (!occurrences.length) continue;
    items.push({ title: schedule.title, category: schedule.category, amount: money(schedule.amountMinor * occurrences.length), occurrences: occurrences.map(dateKey) });
  }
  return { items, total: items.reduce((sum, item) => sum + item.amount, 0) };
}

function actualForMonth(transactions) {
  const result = { income: 0, expenses: 0, savings: 0, categories: {} };
  transactions.forEach((item) => {
    const amount = money(item.amountMinor);
    if (item.type === 'income') result.income += amount;
    else {
      result.expenses += amount;
      result.categories[item.category] = (result.categories[item.category] || 0) + amount;
    }
  });
  result.savings = result.income - result.expenses;
  return result;
}

async function accuracyHistory(userId, targetMonth) {
  const snapshots = await ForecastSnapshot.find({ userId, targetMonth: { $lt: targetMonth } }).sort({ targetMonth: -1 }).limit(6).lean();
  return Promise.all(snapshots.map(async (snapshot) => {
    const { start, end } = monthRange(snapshot.targetMonth);
    const actualTransactions = await Transaction.find({ userId, date: { $gte: start, $lt: end } }).select('type amountMinor category').lean();
    const actual = actualForMonth(actualTransactions);
    const predicted = snapshot.forecast.monthly.expenses;
    return {
      targetMonth: snapshot.targetMonth,
      predictedExpenses: predicted,
      actualExpenses: actual.expenses,
      absolutePercentError: actual.expenses ? Number((Math.abs(predicted - actual.expenses) / actual.expenses * 100).toFixed(1)) : null,
      status: actualTransactions.length ? 'actual' : 'missing actuals',
    };
  }));
}

export async function getForecast(userId, targetMonth = shiftMonth(currentMonth(), 1)) {
  const history = await historicalData(userId, targetMonth);
  const historicalExpenseMonths = history.months.filter((month) => history.monthlyValues[month].expense > 0);
  if (historicalExpenseMonths.length < MIN_HISTORY_MONTHS || history.transactionCount < MIN_EXPENSE_TRANSACTIONS) {
    return {
      available: false,
      targetMonth,
      requirements: { minimumHistoricalMonths: MIN_HISTORY_MONTHS, minimumExpenseTransactions: MIN_EXPENSE_TRANSACTIONS },
      historicalMonths: historicalExpenseMonths.length,
      expenseTransactions: history.transactionCount,
      reason: `At least ${MIN_HISTORY_MONTHS} historical expense months and ${MIN_EXPENSE_TRANSACTIONS} expense transactions are required.`,
    };
  }
  const expenseSeries = history.months.map((month, index) => ({ value: history.monthlyValues[month].expense, weight: index + 1 }));
  const incomeSeries = history.months.map((month, index) => ({ value: history.monthlyValues[month].income, weight: index + 1 }));
  const expenseEstimate = weightedMean(expenseSeries);
  const incomeEstimate = weightedMean(incomeSeries);
  const expenseRange = range(expenseSeries.map((item) => item.value), expenseEstimate);
  const categoryForecasts = Object.entries(history.categoryValues).map(([category, values]) => {
    const series = history.months.map((month, index) => ({ value: values[month] || 0, weight: index + 1 }));
    const estimate = weightedMean(series);
    const bounds = range(series.map((item) => item.value), estimate);
    return { category, amount: money(estimate), lower: money(bounds.lower), upper: money(bounds.upper), historicalMonths: series.filter((item) => item.value > 0).length };
  }).filter((item) => item.historicalMonths >= 2).sort((a, b) => b.amount - a.amount);
  const recurring = await recurringForecast(userId, targetMonth);
  const budgets = await Budget.find({ userId, month: targetMonth }).lean();
  const budgetUtilization = budgets.map((budget) => {
    const forecastAmount = budget.category ? categoryForecasts.find((item) => item.category === budget.category)?.amount || 0 : money(expenseEstimate);
    return { category: budget.category || 'Overall', budget: money(budget.amountMinor), forecast: forecastAmount, utilization: budget.amountMinor ? Number((forecastAmount / money(budget.amountMinor * 100) * 100).toFixed(1)) : 0 };
  });
  const forecast = {
    available: true,
    targetMonth,
    method: 'Weighted six-month average with sample standard deviation range; recurring schedules are added separately.',
    historicalMonths: historicalExpenseMonths.length,
    expenseTransactions: history.transactionCount,
    monthly: { expenses: money(expenseEstimate), lower: money(expenseRange.lower), upper: money(expenseRange.upper), income: money(incomeEstimate), savings: money(incomeEstimate - expenseEstimate) },
    categories: categoryForecasts,
    recurringPayments: recurring,
    budgetUtilization,
    accuracy: await accuracyHistory(userId, targetMonth),
    actual: targetMonth <= currentMonth() ? actualForMonth(await Transaction.find({ userId, date: { $gte: monthRange(targetMonth).start, $lt: monthRange(targetMonth).end } }).select('type amountMinor category').lean()) : null,
  };
  await ForecastSnapshot.findOneAndUpdate({ userId, targetMonth }, { $set: { forecast, generatedAt: new Date() }, $setOnInsert: { userId, targetMonth } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  return forecast;
}
