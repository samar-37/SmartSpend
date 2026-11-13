import { asyncHandler } from '../utils/asyncHandler.js';
import { parseAmountToMinor } from '../utils/money.js';
import {
  createTransaction, deleteTransaction, getDashboard, getSummary, getTransaction, listTransactions, updateTransaction,
} from '../services/transactionService.js';
import { evaluateBudgetAlerts } from '../services/notificationService.js';
import { markOccurrenceDeleted } from '../services/recurringPaymentService.js';

function normalizeData(data) {
  const normalized = { ...data };
  if (normalized.amount !== undefined) {
    normalized.amountMinor = parseAmountToMinor(normalized.amount);
    delete normalized.amount;
  }
  if (normalized.date) normalized.date = new Date(`${normalized.date}T00:00:00.000Z`);
  return normalized;
}

function notFound() {
  const error = new Error('Transaction not found');
  error.statusCode = 404;
  return error;
}

function monthForDate(value) {
  return new Date(value).toISOString().slice(0, 7);
}

export const create = asyncHandler(async (req, res) => {
  const transaction = await createTransaction(req.user._id, normalizeData(req.body));
  const budgetAlerts = transaction.type === 'expense' ? await evaluateBudgetAlerts(req.user._id, [monthForDate(transaction.date)]) : [];
  res.status(201).json({ success: true, transaction, budgetAlerts });
});

export const list = asyncHandler(async (req, res) => {
  const result = await listTransactions(req.user._id, req.validatedQuery || req.query);
  res.json({ success: true, ...result });
});

export const summary = asyncHandler(async (req, res) => {
  res.json({ success: true, summary: await getSummary(req.user._id) });
});

export const dashboard = asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  res.json({ success: true, dashboard: await getDashboard(req.user._id, month) });
});

export const getOne = asyncHandler(async (req, res) => {
  const transaction = await getTransaction(req.user._id, req.params.id);
  if (!transaction) throw notFound();
  res.json({ success: true, transaction });
});

export const update = asyncHandler(async (req, res) => {
  const previous = await getTransaction(req.user._id, req.params.id);
  if (!previous) throw notFound();
  const transaction = await updateTransaction(req.user._id, req.params.id, normalizeData(req.body));
  if (!transaction) throw notFound();
  const months = [monthForDate(previous.date), monthForDate(transaction.date)];
  const budgetAlerts = previous.type === 'expense' || transaction.type === 'expense'
    ? await evaluateBudgetAlerts(req.user._id, months)
    : [];
  res.json({ success: true, transaction, budgetAlerts });
});

export const remove = asyncHandler(async (req, res) => {
  const previous = await getTransaction(req.user._id, req.params.id);
  if (!previous) throw notFound();
  const transaction = await deleteTransaction(req.user._id, req.params.id);
  if (!transaction) throw notFound();
  await markOccurrenceDeleted(req.user._id, previous.recurringPaymentId, previous.recurringOccurrenceDate);
  const budgetAlerts = previous.type === 'expense' ? await evaluateBudgetAlerts(req.user._id, [monthForDate(previous.date)]) : [];
  res.json({ success: true, budgetAlerts });
});
