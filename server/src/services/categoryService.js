import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import { DEFAULT_CATEGORIES, isDefaultCategory } from '../utils/categories.js';

function serialize(category) {
  const item = category.toObject ? category.toObject() : category;
  return { ...item, id: item._id?.toString() || `default-${item.name.toLowerCase()}`, isDefault: Boolean(item.isDefault) };
}

export async function listCategories(userId) {
  const custom = await Category.find({ userId }).sort({ name: 1 });
  return [
    ...DEFAULT_CATEGORIES.map((category) => ({ ...category, id: `default-${category.name.toLowerCase()}`, isDefault: true })),
    ...custom.map((category) => serialize({ ...category.toObject(), isDefault: false })),
  ];
}

export async function createCategory(userId, data) {
  if (isDefaultCategory(data.name)) {
    const error = new Error('That name is reserved for a default category');
    error.statusCode = 409;
    throw error;
  }
  if (await Category.exists({ userId, name: data.name })) {
    const error = new Error('A category with that name already exists');
    error.statusCode = 409;
    throw error;
  }
  const category = await Category.create({ ...data, userId });
  return serialize(category);
}

export async function updateCategory(userId, id, data) {
  const existing = await Category.findOne({ _id: id, userId });
  if (!existing) return null;
  if (data.name && data.name !== existing.name && isDefaultCategory(data.name)) {
    const error = new Error('That name is reserved for a default category');
    error.statusCode = 409;
    throw error;
  }
  if (data.name && data.name !== existing.name && await Category.exists({ userId, name: data.name })) {
    const error = new Error('A category with that name already exists');
    error.statusCode = 409;
    throw error;
  }
  const oldName = existing.name;
  const category = await Category.findOneAndUpdate({ _id: id, userId }, { $set: data }, { new: true, runValidators: true });
  if (data.name && data.name !== oldName) {
    await Transaction.updateMany({ userId, category: oldName }, { $set: { category: data.name } });
  }
  return category ? serialize(category) : null;
}

export async function deleteCategory(userId, id, replacementCategory = 'Other') {
  const category = await Category.findOne({ _id: id, userId });
  if (!category) return null;
  if (isDefaultCategory(category.name)) {
    const error = new Error('Default categories cannot be deleted');
    error.statusCode = 400;
    throw error;
  }
  if (replacementCategory === category.name) {
    const error = new Error('Replacement category must be different');
    error.statusCode = 400;
    throw error;
  }
  const replacementIsDefault = isDefaultCategory(replacementCategory);
  const replacementIsCustom = await Category.exists({ userId, name: replacementCategory });
  if (!replacementIsDefault && !replacementIsCustom) {
    const error = new Error('Replacement category is not available');
    error.statusCode = 400;
    throw error;
  }
  await Transaction.updateMany({ userId, category: category.name }, { $set: { category: replacementCategory } });
  await category.deleteOne();
  return { reassignedTo: replacementCategory };
}
