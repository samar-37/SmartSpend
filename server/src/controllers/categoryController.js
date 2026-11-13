import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../services/categoryService.js';

export const list = asyncHandler(async (req, res) => {
  res.json({ success: true, categories: await listCategories(req.user._id) });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, category: await createCategory(req.user._id, req.body) });
});

export const update = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    const error = new Error('Custom category not found');
    error.statusCode = 404;
    throw error;
  }
  const category = await updateCategory(req.user._id, req.params.id, req.body);
  if (!category) {
    const error = new Error('Custom category not found');
    error.statusCode = 404;
    throw error;
  }
  res.json({ success: true, category });
});

export const remove = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    const error = new Error('Custom category not found');
    error.statusCode = 404;
    throw error;
  }
  const result = await deleteCategory(req.user._id, req.params.id, req.query.replacementCategory || 'Other');
  if (!result) {
    const error = new Error('Custom category not found');
    error.statusCode = 404;
    throw error;
  }
  res.json({ success: true, ...result });
});
