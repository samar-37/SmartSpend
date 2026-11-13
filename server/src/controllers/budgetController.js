import { asyncHandler } from '../utils/asyncHandler.js';
import { createBudget, deleteBudget, listBudgetHistory, listBudgets, updateBudget } from '../services/budgetService.js';
import { evaluateBudgetAlerts } from '../services/notificationService.js';

export const list = asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  res.json({ success: true, budgets: await listBudgets(req.user._id, month) });
});

export const history = asyncHandler(async (req, res) => {
  res.json({ success: true, budgets: await listBudgetHistory(req.user._id) });
});

export const create = asyncHandler(async (req, res) => {
  const budget = await createBudget(req.user._id, req.body);
  const budgetAlerts = await evaluateBudgetAlerts(req.user._id, [budget.month]);
  res.status(201).json({ success: true, budget, budgetAlerts });
});

export const update = asyncHandler(async (req, res) => {
  const budget = await updateBudget(req.user._id, req.params.id, req.body);
  if (!budget) {
    const error = new Error('Budget not found');
    error.statusCode = 404;
    throw error;
  }
  const budgetAlerts = await evaluateBudgetAlerts(req.user._id, [budget.month]);
  res.json({ success: true, budget, budgetAlerts });
});

export const remove = asyncHandler(async (req, res) => {
  const budget = await deleteBudget(req.user._id, req.params.id);
  if (!budget) {
    const error = new Error('Budget not found');
    error.statusCode = 404;
    throw error;
  }
  res.json({ success: true });
});
