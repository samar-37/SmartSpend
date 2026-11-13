import { asyncHandler } from '../utils/asyncHandler.js';
import { addContribution, createGoal, deleteGoal, getGoal, listGoals, removeContribution as removeGoalContribution, updateGoal } from '../services/savingsGoalService.js';

export const list = asyncHandler(async (req, res) => res.json({ success: true, goals: await listGoals(req.user._id) }));
export const getOne = asyncHandler(async (req, res) => {
  const goal = await getGoal(req.user._id, req.params.id);
  if (!goal) { const error = new Error('Savings goal not found'); error.statusCode = 404; throw error; }
  res.json({ success: true, goal });
});
export const create = asyncHandler(async (req, res) => res.status(201).json({ success: true, goal: await createGoal(req.user._id, req.body) }));
export const update = asyncHandler(async (req, res) => {
  const goal = await updateGoal(req.user._id, req.params.id, req.body);
  if (!goal) { const error = new Error('Savings goal not found'); error.statusCode = 404; throw error; }
  res.json({ success: true, goal });
});
export const remove = asyncHandler(async (req, res) => {
  const goal = await deleteGoal(req.user._id, req.params.id);
  if (!goal) { const error = new Error('Savings goal not found'); error.statusCode = 404; throw error; }
  res.json({ success: true });
});
export const contribute = asyncHandler(async (req, res) => {
  const goal = await addContribution(req.user._id, req.params.id, req.body);
  if (!goal) { const error = new Error('Savings goal not found'); error.statusCode = 404; throw error; }
  res.status(201).json({ success: true, goal });
});
export const removeContribution = asyncHandler(async (req, res) => {
  const goal = await removeGoalContribution(req.user._id, req.params.id, req.params.contributionId);
  if (goal === null) { const error = new Error('Savings goal not found'); error.statusCode = 404; throw error; }
  if (goal === undefined) { const error = new Error('Contribution not found'); error.statusCode = 404; throw error; }
  res.json({ success: true, goal });
});
