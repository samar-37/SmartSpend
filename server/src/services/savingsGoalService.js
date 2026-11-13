import mongoose from 'mongoose';
import SavingsGoal from '../models/SavingsGoal.js';
import { formatMinorAmount, parseAmountToMinor } from '../utils/money.js';

function dateKey(value) { return new Date(value).toISOString().slice(0, 10); }
function parseDate(value) { return new Date(`${value}T00:00:00.000Z`); }

function serialize(goal) {
  const item = goal.toObject ? goal.toObject() : goal;
  const currentMinor = item.contributions.reduce((sum, contribution) => sum + contribution.amountMinor, 0);
  const remainingMinor = Math.max(item.targetAmountMinor - currentMinor, 0);
  const progress = item.targetAmountMinor ? Number(Math.min(currentMinor / item.targetAmountMinor * 100, 100).toFixed(2)) : 0;
  const completed = currentMinor >= item.targetAmountMinor;
  const now = new Date();
  const monthsRemaining = Math.max(
    (item.targetDate.getUTCFullYear() - now.getUTCFullYear()) * 12 + item.targetDate.getUTCMonth() - now.getUTCMonth() + 1,
    1,
  );
  const suggestedMonthlyMinor = completed ? 0 : Math.ceil(remainingMinor / monthsRemaining);
  const contributionsByMonth = {};
  item.contributions.forEach((contribution) => {
    const key = dateKey(contribution.date).slice(0, 7);
    contributionsByMonth[key] = (contributionsByMonth[key] || 0) + contribution.amountMinor;
  });
  const monthlyValues = Object.values(contributionsByMonth);
  const averageMonthlyMinor = monthlyValues.length ? monthlyValues.reduce((sum, value) => sum + value, 0) / monthlyValues.length : 0;
  let estimatedCompletionDate = null;
  if (!completed && averageMonthlyMinor > 0) {
    const months = Math.ceil(remainingMinor / averageMonthlyMinor);
    const estimate = new Date(now);
    estimate.setUTCDate(1);
    estimate.setUTCMonth(estimate.getUTCMonth() + months);
    estimatedCompletionDate = dateKey(estimate);
  }
  return {
    id: item._id.toString(), name: item.name, targetAmount: formatMinorAmount(item.targetAmountMinor),
    targetAmountMinor: item.targetAmountMinor, currentSaved: formatMinorAmount(currentMinor), currentSavedMinor: currentMinor,
    remaining: formatMinorAmount(remainingMinor), remainingMinor, progress, completed,
    targetDate: dateKey(item.targetDate), description: item.description, suggestedMonthlyContribution: formatMinorAmount(suggestedMonthlyMinor),
    estimatedCompletionDate, contributions: item.contributions.map((contribution) => ({
      id: contribution._id.toString(), amount: formatMinorAmount(contribution.amountMinor), amountMinor: contribution.amountMinor,
      date: dateKey(contribution.date), note: contribution.note, createdAt: contribution.createdAt,
    })),
    createdAt: item.createdAt, updatedAt: item.updatedAt,
  };
}

async function findGoal(userId, id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return SavingsGoal.findOne({ _id: id, userId });
}

export async function listGoals(userId) {
  const goals = await SavingsGoal.find({ userId }).sort({ targetDate: 1, createdAt: -1 });
  return goals.map(serialize);
}

export async function getGoal(userId, id) {
  const goal = await findGoal(userId, id);
  return goal ? serialize(goal) : null;
}

export async function createGoal(userId, data) {
  const goal = await SavingsGoal.create({ ...data, userId, targetAmountMinor: parseAmountToMinor(data.targetAmount), targetDate: parseDate(data.targetDate) });
  return serialize(goal);
}

export async function updateGoal(userId, id, data) {
  const goal = await findGoal(userId, id);
  if (!goal) return null;
  if (data.targetAmount !== undefined) goal.targetAmountMinor = parseAmountToMinor(data.targetAmount);
  if (data.targetDate) goal.targetDate = parseDate(data.targetDate);
  if (data.name !== undefined) goal.name = data.name;
  if (data.description !== undefined) goal.description = data.description;
  await goal.save();
  return serialize(goal);
}

export async function deleteGoal(userId, id) {
  return SavingsGoal.findOneAndDelete({ _id: id, userId });
}

export async function addContribution(userId, id, data) {
  const goal = await findGoal(userId, id);
  if (!goal) return null;
  goal.contributions.push({ amountMinor: parseAmountToMinor(data.amount), date: parseDate(data.date), note: data.note || '' });
  await goal.save();
  return serialize(goal);
}

export async function removeContribution(userId, id, contributionId) {
  const goal = await findGoal(userId, id);
  if (!goal) return null;
  const contribution = goal.contributions.id(contributionId);
  if (!contribution) return undefined;
  contribution.deleteOne();
  await goal.save();
  return serialize(goal);
}
