import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { formatMinorAmount } from '../utils/money.js';

const DAY = 24 * 60 * 60 * 1000;

function dateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function monthStart(year, month) {
  return new Date(Date.UTC(year, month - 1, 1));
}

function monthKey(date) {
  return date.toISOString().slice(0, 7);
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function weekStart(date) {
  const result = new Date(date);
  const day = result.getUTCDay();
  result.setUTCDate(result.getUTCDate() - (day === 0 ? 6 : day - 1));
  return result;
}

function buildRange(query) {
  const now = new Date();
  let start;
  let end;
  if (query.month) {
    const [year, month] = query.month.split('-').map(Number);
    start = monthStart(year, month);
    end = monthStart(year, month + 1);
  } else if (query.year) {
    start = new Date(Date.UTC(query.year, 0, 1));
    end = new Date(Date.UTC(query.year + 1, 0, 1));
  } else if (query.from || query.to) {
    start = query.from ? dateOnly(query.from) : new Date(now.getTime() - 365 * DAY);
    end = query.to ? new Date(dateOnly(query.to).getTime() + DAY) : new Date(now.getTime() + DAY);
  } else {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
    end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  }
  if (query.from) start = dateOnly(query.from);
  if (query.to) end = new Date(dateOnly(query.to).getTime() + DAY);
  return { start, end };
}

function fillMonths(start, end, values) {
  const result = [];
  for (let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)); cursor < end; cursor.setUTCMonth(cursor.getUTCMonth() + 1)) {
    const key = monthKey(cursor);
    result.push({ month: key, income: 0, expense: 0, savings: 0, ...(values[key] || {}) });
  }
  return result;
}

function fillDays(start, end, values) {
  const result = [];
  for (let cursor = new Date(start); cursor < end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const key = dateKey(cursor);
    result.push({ date: key, amount: 0, ...(values[key] || {}) });
  }
  return result;
}

function fillWeeks(start, end, values) {
  const first = weekStart(start);
  const result = [];
  for (let cursor = new Date(first); cursor < end; cursor.setUTCDate(cursor.getUTCDate() + 7)) {
    const key = dateKey(cursor);
    result.push({ week: key, amount: 0, ...(values[key] || {}) });
  }
  return result;
}

export async function getAnalytics(userId, query) {
  const { start, end } = buildRange(query);
  const match = {
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: start, $lt: end },
    ...(query.type ? { type: query.type } : {}),
    ...(query.category ? { category: query.category } : {}),
  };
  const [totals, monthlyGroups, categoryGroups, dailyGroups, topExpenses, distribution] = await Promise.all([
    Transaction.aggregate([{ $match: match }, { $group: { _id: '$type', totalMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } }]),
    Transaction.aggregate([{ $match: match }, { $group: { _id: { month: { $dateToString: { format: '%Y-%m', date: '$date', timezone: 'UTC' } }, type: '$type' }, totalMinor: { $sum: '$amountMinor' } } }]),
    Transaction.aggregate([{ $match: { ...match, type: 'expense' } }, { $group: { _id: '$category', totalMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } }, { $sort: { totalMinor: -1 } }]),
    Transaction.aggregate([{ $match: { ...match, type: 'expense' } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'UTC' } }, totalMinor: { $sum: '$amountMinor' } } }]),
    Transaction.find({ ...match, type: 'expense' }).sort({ amountMinor: -1, date: -1 }).limit(10).lean(),
    Transaction.aggregate([{ $match: match }, { $group: { _id: '$type', totalMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } }]),
  ]);
  const totalMinor = { income: 0, expense: 0 };
  const monthly = {};
  for (const item of monthlyGroups) {
    const key = item._id.month;
    monthly[key] ||= {};
    monthly[key][item._id.type] = Number(formatMinorAmount(item.totalMinor));
    totalMinor[item._id.type] += item.totalMinor;
  }
  const monthlyData = fillMonths(start, end, monthly).map((item) => ({ ...item, savings: Number((item.income - item.expense).toFixed(2)) }));
  const categories = categoryGroups.map((item) => ({ name: item._id, amount: Number(formatMinorAmount(item.totalMinor)), count: item.count }));
  const dailyValues = Object.fromEntries(dailyGroups.map((item) => [item._id, { amount: Number(formatMinorAmount(item.totalMinor)) }]));
  const weeklyValues = {};
  for (const item of dailyGroups) {
    const key = dateKey(weekStart(dateOnly(item._id)));
    weeklyValues[key] = { amount: Number(((weeklyValues[key]?.amount || 0) + Number(formatMinorAmount(item.totalMinor))).toFixed(2)) };
  }
  const daily = fillDays(start, end, dailyValues);
  const weekly = fillWeeks(start, end, weeklyValues);
  const income = Number(formatMinorAmount(totalMinor.income));
  const expense = Number(formatMinorAmount(totalMinor.expense));
  return {
    filters: { from: dateKey(start), to: dateKey(new Date(end.getTime() - DAY)), month: query.month || null, year: query.year || null, category: query.category || null, type: query.type || null },
    totals: { income, expense, savings: Number((income - expense).toFixed(2)), savingsRate: income ? Number(((income - expense) / income * 100).toFixed(2)) : 0, transactionCount: totals.reduce((sum, item) => sum + item.count, 0) },
    monthly: monthlyData,
    categoryExpenses: categories,
    topCategories: categories.slice(0, 5),
    weekly,
    daily,
    highestExpenses: topExpenses.map((item) => ({ id: item._id.toString(), title: item.title, amount: Number(formatMinorAmount(item.amountMinor)), category: item.category, date: dateKey(new Date(item.date)) })),
    distribution: distribution.map((item) => ({ type: item._id, amount: Number(formatMinorAmount(item.totalMinor)), count: item.count })),
  };
}
