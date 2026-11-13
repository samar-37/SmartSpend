import mongoose from 'mongoose';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { formatMinorAmount, parseAmountToMinor } from '../utils/money.js';

function validateMonth(value) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    const error = new Error('Month must use YYYY-MM');
    error.statusCode = 400;
    throw error;
  }
}

function serialize(budget, spentMinor = 0) {
  const item = budget.toObject ? budget.toObject() : budget;
  const remainingMinor = item.amountMinor - spentMinor;
  const utilization = item.amountMinor ? Number((spentMinor / item.amountMinor * 100).toFixed(2)) : 0;
  const warningThresholds = item.warningThresholds || [75, 90, 100];
  const warningLevel = utilization >= warningThresholds[2] ? 'critical' : utilization >= warningThresholds[1] ? 'high' : utilization >= warningThresholds[0] ? 'medium' : 'safe';
  return {
    id: item._id.toString(),
    month: item.month,
    category: item.category,
    amount: formatMinorAmount(item.amountMinor),
    amountMinor: item.amountMinor,
    spent: formatMinorAmount(spentMinor),
    spentMinor,
    remaining: formatMinorAmount(remainingMinor),
    remainingMinor,
    utilization,
    warningLevel,
    warningThresholds,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function spendingForMonth(userId, month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));
  const groups = await Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', spentMinor: { $sum: '$amountMinor' } } },
  ]);
  const spending = Object.fromEntries(groups.map((group) => [group._id, group.spentMinor]));
  spending.overall = groups.reduce((total, group) => total + group.spentMinor, 0);
  return spending;
}

export async function listBudgets(userId, month) {
  validateMonth(month);
  const [budgets, spending] = await Promise.all([Budget.find({ userId, month }).sort({ category: 1 }), spendingForMonth(userId, month)]);
  return budgets.map((budget) => serialize(budget, budget.category === null ? spending.overall : spending[budget.category] || 0));
}

export async function listBudgetHistory(userId) {
  const budgets = await Budget.find({ userId }).sort({ month: -1, category: 1 });
  const spendingByMonth = {};
  for (const budget of budgets) {
    if (!spendingByMonth[budget.month]) spendingByMonth[budget.month] = await spendingForMonth(userId, budget.month);
  }
  return budgets.map((budget) => serialize(
    budget,
    budget.category === null ? spendingByMonth[budget.month].overall : spendingByMonth[budget.month][budget.category] || 0,
  ));
}

export async function createBudget(userId, data) {
  const budget = await Budget.create({ ...data, userId, amountMinor: parseAmountToMinor(data.amount) });
  return serialize(budget);
}

export async function updateBudget(userId, id, data) {
  if (!mongoose.isValidObjectId(id)) return null;
  const updates = { ...data };
  if (updates.amount !== undefined) updates.amountMinor = parseAmountToMinor(updates.amount);
  delete updates.amount;
  const budget = await Budget.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true, runValidators: true });
  if (!budget) return null;
  const spending = await spendingForMonth(userId, budget.month);
  return serialize(budget, budget.category === null ? spending.overall : spending[budget.category] || 0);
}

export async function deleteBudget(userId, id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Budget.findOneAndDelete({ _id: id, userId });
}
