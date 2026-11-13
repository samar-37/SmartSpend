import mongoose from 'mongoose';
import Budget from '../models/Budget.js';
import BudgetAlertState from '../models/BudgetAlertState.js';
import Notification from '../models/Notification.js';
import NotificationPreference from '../models/NotificationPreference.js';
import RecurringPayment from '../models/RecurringPayment.js';
import SavingsGoal from '../models/SavingsGoal.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { formatMinorAmount } from '../utils/money.js';
import { dateKey, nextOccurrence } from '../utils/recurrence.js';

const preferenceForType = {
  recurring_payment: 'recurringPayment',
  budget_warning: 'budgetWarning',
  budget_exceeded: 'budgetExceeded',
  savings_milestone: 'savingsMilestone',
  monthly_summary: 'monthlySummary',
  account_event: 'accountEvent',
};

const milestones = [25, 50, 75, 100];

function monthBounds(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, monthNumber - 1, 1)),
    end: new Date(Date.UTC(year, monthNumber, 1)),
  };
}

function localDateKey(date, timezone = 'UTC') {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function currentMonth(timezone = 'UTC') {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit' }).format(new Date());
}

async function isEnabled(userId, type) {
  const preferences = await NotificationPreference.findOne({ userId }).lean();
  return preferences?.consentGranted === true && preferences?.[preferenceForType[type]] !== false;
}

function budgetPreferenceKey(threshold) {
  if (threshold >= 100) return 'budgetExceeded';
  if (threshold >= 90) return 'budgetWarning90';
  if (threshold >= 75) return 'budgetWarning75';
  return 'budgetWarning';
}

async function isBudgetThresholdEnabled(userId, threshold) {
  const preferences = await NotificationPreference.findOne({ userId }).lean();
  if (preferences?.consentGranted !== true) return false;
  if (preferences?.budgetWarning === false && threshold < 100) return false;
  return preferences?.[budgetPreferenceKey(threshold)] !== false;
}

export async function createNotification({ userId, type, title, message, dedupeKey, metadata = {} }) {
  if (!(await isEnabled(userId, type))) return null;
  try {
    return await Notification.create({ userId, type, title, message, dedupeKey, metadata });
  } catch (error) {
    if (error?.code === 11000) return null;
    throw error;
  }
}

export async function listNotifications(userId, { page = 1, limit = 20 } = {}) {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 50);
  const filter = { userId };
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, readAt: null }),
  ]);
  return { items, unread, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
}

export async function listActiveBudgetAlerts(userId) {
  const notifications = await Notification.find({
    userId,
    type: { $in: ['budget_warning', 'budget_exceeded'] },
  }).sort({ createdAt: -1 }).limit(50).lean();
  const active = [];
  for (const notification of notifications) {
    const metadata = notification.metadata || {};
    if (!metadata.budgetId || !metadata.threshold) continue;
    const budget = await Budget.findOne({ _id: metadata.budgetId, userId }).lean();
    if (!budget) continue;
    const spentMinor = await spendingForBudget(userId, budget);
    if (spentMinor / budget.amountMinor * 100 < metadata.threshold) continue;
    active.push({ ...notification, metadata: { ...metadata, amountMinor: budget.amountMinor, spentMinor, remainingMinor: budget.amountMinor - spentMinor, exceededMinor: Math.max(spentMinor - budget.amountMinor, 0) } });
  }
  return active;
}

export async function markNotificationRead(userId, id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Notification.findOneAndUpdate({ _id: id, userId }, { $set: { readAt: new Date() } }, { new: true }).lean();
}

export async function markAllNotificationsRead(userId) {
  await Notification.updateMany({ userId, readAt: null }, { $set: { readAt: new Date() } });
}

export async function deleteNotification(userId, id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Notification.findOneAndDelete({ _id: id, userId }).lean();
}

export async function getNotificationPreferences(userId) {
  return NotificationPreference.findOneAndUpdate({ userId }, { $setOnInsert: { userId } }, { new: true, upsert: true, setDefaultsOnInsert: true, lean: true });
}

export async function updateNotificationPreferences(userId, updates) {
  return NotificationPreference.findOneAndUpdate({ userId }, { $set: updates }, { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true, lean: true });
}

async function spendingForBudget(userId, budget) {
  const { start, end } = monthBounds(budget.month);
  const match = { userId, type: 'expense', date: { $gte: start, $lt: end } };
  if (budget.category) match.category = budget.category;
  const result = await Transaction.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$amountMinor' } } }]);
  return result[0]?.total || 0;
}

function serializeBudgetAlert(notification, budget, month, threshold, spentMinor) {
  const amountMinor = budget.amountMinor;
  return {
    id: notification?._id?.toString(),
    notificationId: notification?._id?.toString(),
    budgetId: budget._id.toString(),
    month,
    category: budget.category,
    threshold,
    amountMinor,
    spentMinor,
    remainingMinor: amountMinor - spentMinor,
    exceededMinor: Math.max(spentMinor - amountMinor, 0),
    title: notification?.title,
    message: notification?.message,
    createdAt: notification?.createdAt,
  };
}

export async function evaluateBudgetAlerts(userId, months = []) {
  const targetMonths = [...new Set(months.filter(Boolean))];
  if (!targetMonths.length) targetMonths.push(currentMonth());
  const budgets = await Budget.find({ userId, month: { $in: targetMonths } }).lean();
  const alerts = [];
  for (const budget of budgets) {
    const spentMinor = await spendingForBudget(userId, budget);
    const utilization = budget.amountMinor ? spentMinor / budget.amountMinor * 100 : 0;
    const thresholds = [...new Set((budget.warningThresholds || [75, 90, 100]).filter((value) => [75, 90, 100].includes(value)))].sort((a, b) => a - b);
    for (const threshold of thresholds) {
      if (utilization < threshold || !(await isBudgetThresholdEnabled(userId, threshold))) continue;
      let state;
      try {
        state = await BudgetAlertState.create({ userId, budgetId: budget._id, month: budget.month, threshold });
      } catch (error) {
        if (error?.code === 11000) continue;
        throw error;
      }
      const type = threshold >= 100 ? 'budget_exceeded' : 'budget_warning';
      const categoryLabel = budget.category || 'Overall';
      const remaining = Math.max(budget.amountMinor - spentMinor, 0);
      const message = threshold >= 100
        ? `${categoryLabel} spending is ${formatMinorAmount(spentMinor)}, exceeding the ${formatMinorAmount(budget.amountMinor)} budget by ${formatMinorAmount(spentMinor - budget.amountMinor)}.`
        : `${categoryLabel} spending has reached ${Math.round(utilization)}% of its ${formatMinorAmount(budget.amountMinor)} budget. ${formatMinorAmount(remaining)} remaining.`;
      const notification = await createNotification({
        userId,
        type,
        title: threshold >= 100 ? 'Budget exceeded' : threshold >= 90 ? 'Budget almost exhausted' : 'Budget getting low',
        message,
        dedupeKey: `budget:${budget._id}:${budget.month}:${threshold}`,
        metadata: {
          budgetId: budget._id,
          month: budget.month,
          threshold,
          amountMinor: budget.amountMinor,
          spentMinor,
          remainingMinor: budget.amountMinor - spentMinor,
          exceededMinor: Math.max(spentMinor - budget.amountMinor, 0),
        },
      });
      if (notification) alerts.push(serializeBudgetAlert(notification, budget, budget.month, threshold, spentMinor));
    }
  }
  return alerts;
}

async function scheduleRecurringNotifications(user) {
  if (!(await isEnabled(user._id, 'recurring_payment'))) return;
  const schedules = await RecurringPayment.find({ userId: user._id, status: 'active' }).lean();
  const today = localDateKey(new Date(), user.profile?.timezone || 'UTC');
  for (const schedule of schedules) {
    const occurrence = nextOccurrence(schedule);
    if (!occurrence) continue;
    const occurrenceKey = dateKey(occurrence);
    const daysUntil = Math.round((new Date(`${occurrenceKey}T00:00:00Z`) - new Date(`${today}T00:00:00Z`)) / 86400000);
    if (daysUntil < 0 || daysUntil > 3) continue;
    await createNotification({
      userId: user._id,
      type: 'recurring_payment',
      title: 'Upcoming recurring payment',
      message: `${schedule.title} of ${formatMinorAmount(schedule.amountMinor)} is due on ${occurrenceKey}.`,
      dedupeKey: `recurring:${schedule._id}:${occurrenceKey}`,
      metadata: { recurringPaymentId: schedule._id, occurrenceDate: occurrenceKey },
    });
  }
}

async function scheduleBudgetNotifications(user) {
  await evaluateBudgetAlerts(user._id, [currentMonth(user.profile?.timezone || 'UTC')]);
}

async function scheduleSavingsNotifications(user) {
  if (!(await isEnabled(user._id, 'savings_milestone'))) return;
  const goals = await SavingsGoal.find({ userId: user._id }).lean();
  for (const goal of goals) {
    const saved = goal.contributions.reduce((sum, contribution) => sum + contribution.amountMinor, 0);
    const progress = goal.targetAmountMinor ? saved / goal.targetAmountMinor * 100 : 0;
    for (const milestone of milestones.filter((value) => progress >= value)) {
      await createNotification({
        userId: user._id,
        type: 'savings_milestone',
        title: 'Savings goal milestone',
        message: `${goal.name} has reached ${milestone}% of its target.`,
        dedupeKey: `goal-milestone:${goal._id}:${milestone}`,
        metadata: { goalId: goal._id, milestone },
      });
    }
  }
}

async function scheduleMonthlySummary(user) {
  const timezone = user.profile?.timezone || 'UTC';
  const now = new Date();
  const localDay = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, day: '2-digit' }).format(now);
  if (localDay !== '01' || !(await isEnabled(user._id, 'monthly_summary'))) return;
  const month = currentMonth(timezone);
  const previous = new Date(`${month}-01T00:00:00Z`);
  previous.setUTCMonth(previous.getUTCMonth() - 1);
  const previousMonth = previous.toISOString().slice(0, 7);
  const { start, end } = monthBounds(previousMonth);
  const groups = await Transaction.aggregate([
    { $match: { userId: user._id, date: { $gte: start, $lt: end } } },
    { $group: { _id: '$type', total: { $sum: '$amountMinor' } } },
  ]);
  const totals = Object.fromEntries(groups.map((group) => [group._id, group.total]));
  await createNotification({
    userId: user._id,
    type: 'monthly_summary',
    title: 'Your monthly financial summary',
    message: `${previousMonth}: ${formatMinorAmount(totals.income || 0)} income and ${formatMinorAmount(totals.expense || 0)} expenses.`,
    dedupeKey: `monthly-summary:${user._id}:${previousMonth}`,
    metadata: { month: previousMonth, incomeMinor: totals.income || 0, expenseMinor: totals.expense || 0 },
  });
}

export async function runNotificationJobs() {
  const users = await User.find({}).select('_id profile.timezone').lean();
  for (const user of users) {
    await scheduleRecurringNotifications(user);
    await scheduleBudgetNotifications(user);
    await scheduleSavingsNotifications(user);
    await scheduleMonthlySummary(user);
  }
}
