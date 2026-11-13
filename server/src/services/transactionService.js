import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { formatMinorAmount } from '../utils/money.js';
import { parseAmountToMinor } from '../utils/money.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function serialize(transaction) {
  const item = transaction.toObject ? transaction.toObject() : transaction;
  return {
    ...item,
    id: item._id.toString(),
    source: item.recurringPaymentId ? 'recurring' : 'manual',
    isRecurring: Boolean(item.recurringPaymentId),
    amount: formatMinorAmount(item.amountMinor),
    date: new Date(item.date).toISOString().slice(0, 10),
  };
}

export async function createTransaction(userId, data) {
  const transaction = await Transaction.create({ ...data, userId });
  return serialize(transaction);
}

export async function listTransactions(userId, query) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
  const filter = { userId };
  if (query.source === 'recurring') filter.recurringPaymentId = { $exists: true };
  if (query.source === 'manual') filter.recurringPaymentId = { $exists: false };
  if (query.type && ['income', 'expense'].includes(query.type)) filter.type = query.type;
  if (query.category) filter.category = query.category;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
  if (query.search) {
    const search = escapeRegex(query.search.trim());
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];
  }
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) filter.date.$lte = new Date(`${query.to}T23:59:59.999Z`);
  }
  if (query.minAmount !== undefined || query.maxAmount !== undefined) {
    filter.amountMinor = {};
    if (query.minAmount !== undefined) filter.amountMinor.$gte = parseAmountToMinor(String(query.minAmount));
    if (query.maxAmount !== undefined) filter.amountMinor.$lte = parseAmountToMinor(String(query.maxAmount));
  }
  const sortField = ['date', 'amountMinor', 'createdAt', 'title'].includes(query.sortBy) ? query.sortBy : 'date';
  const sortDirection = query.order === 'asc' ? 1 : -1;
  const [items, total] = await Promise.all([
    Transaction.find(filter).sort({ [sortField]: sortDirection, _id: -1 }).skip((page - 1) * limit).limit(limit),
    Transaction.countDocuments(filter),
  ]);
  return {
    items: items.map(serialize),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getTransaction(userId, transactionId) {
  if (!mongoose.isValidObjectId(transactionId)) return null;
  const transaction = await Transaction.findOne({ _id: transactionId, userId });
  return transaction ? serialize(transaction) : null;
}

export async function updateTransaction(userId, transactionId, data) {
  if (!mongoose.isValidObjectId(transactionId)) return null;
  const transaction = await Transaction.findOneAndUpdate(
    { _id: transactionId, userId },
    { $set: data },
    { new: true, runValidators: true },
  );
  return transaction ? serialize(transaction) : null;
}

export async function deleteTransaction(userId, transactionId) {
  if (!mongoose.isValidObjectId(transactionId)) return null;
  return Transaction.findOneAndDelete({ _id: transactionId, userId });
}

export async function getSummary(userId) {
  const groups = await Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$type', totalMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } },
  ]);
  const totals = { incomeMinor: 0, expenseMinor: 0, income: '0.00', expense: '0.00', balance: '0.00', transactionCount: 0 };
  for (const group of groups) {
    totals[`${group._id}Minor`] = group.totalMinor;
    totals[group._id] = formatMinorAmount(group.totalMinor);
    totals.transactionCount += group.count;
  }
  totals.balance = formatMinorAmount(totals.incomeMinor - totals.expenseMinor);
  return totals;
}

export async function getDashboard(userId, month) {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) {
    const error = new Error('Month must use YYYY-MM format');
    error.statusCode = 400;
    throw error;
  }
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  const match = { userId: new mongoose.Types.ObjectId(userId), date: { $gte: start, $lt: end } };
  const [groups, allTimeGroups, categoryGroups, dailyGroups, monthlyGroups, recent] = await Promise.all([
    Transaction.aggregate([{ $match: match }, { $group: { _id: '$type', totalMinor: { $sum: '$amountMinor' }, count: { $sum: 1 } } }]),
    Transaction.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(userId) } }, { $group: { _id: '$type', totalMinor: { $sum: '$amountMinor' } } }]),
    Transaction.aggregate([{ $match: { ...match, type: 'expense' } }, { $group: { _id: '$category', totalMinor: { $sum: '$amountMinor' } } }, { $sort: { totalMinor: -1 } }]),
    Transaction.aggregate([
      { $match: { ...match, type: 'expense' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'UTC' } }, totalMinor: { $sum: '$amountMinor' } } },
      { $sort: { _id: 1 } },
    ]),
    Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: new Date(Date.UTC(year, monthNumber - 6, 1)), $lt: end } } },
      { $group: { _id: { month: { $dateToString: { format: '%Y-%m', date: '$date', timezone: 'UTC' } }, type: '$type' }, totalMinor: { $sum: '$amountMinor' } } },
      { $sort: { '_id.month': 1 } },
    ]),
    Transaction.find(match).sort({ date: -1, createdAt: -1 }).limit(5),
  ]);
  const totals = { incomeMinor: 0, expenseMinor: 0, income: '0.00', expense: '0.00', allTimeIncome: '0.00', allTimeExpense: '0.00', savings: '0.00', balance: '0.00', currentBalance: '0.00', savingsRate: 0, transactionCount: 0 };
  for (const group of groups) {
    totals[`${group._id}Minor`] = group.totalMinor;
    totals[group._id] = formatMinorAmount(group.totalMinor);
    totals.transactionCount += group.count;
  }
  totals.savings = formatMinorAmount(totals.incomeMinor - totals.expenseMinor);
  const allTime = { incomeMinor: 0, expenseMinor: 0 };
  for (const group of allTimeGroups) allTime[`${group._id}Minor`] = group.totalMinor;
  totals.allTimeIncome = formatMinorAmount(allTime.incomeMinor);
  totals.allTimeExpense = formatMinorAmount(allTime.expenseMinor);
  totals.currentBalance = formatMinorAmount(allTime.incomeMinor - allTime.expenseMinor);
  totals.balance = totals.currentBalance;
  totals.savingsRate = totals.incomeMinor ? Number(((totals.incomeMinor - totals.expenseMinor) / totals.incomeMinor * 100).toFixed(1)) : 0;
  return {
    month,
    totals,
    categoryExpenses: categoryGroups.map((item) => ({ name: item._id, amount: Number(formatMinorAmount(item.totalMinor)) })),
    dailyExpenses: dailyGroups.map((item) => ({ date: item._id, amount: Number(formatMinorAmount(item.totalMinor)) })),
    monthlyTrend: monthlyGroups.reduce((result, item) => {
      const monthData = result.find((entry) => entry.month === item._id.month) || { month: item._id.month, income: 0, expense: 0 };
      monthData[item._id.type] = Number(formatMinorAmount(item.totalMinor));
      if (!result.includes(monthData)) result.push(monthData);
      return result;
    }, []),
    recentTransactions: recent.map(serialize),
  };
}
