export const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#f59e0b', icon: 'utensils' },
  { name: 'Housing', color: '#8b5cf6', icon: 'home' },
  { name: 'Transport', color: '#06b6d4', icon: 'car' },
  { name: 'Shopping', color: '#ec4899', icon: 'shopping-bag' },
  { name: 'Bills', color: '#ef4444', icon: 'receipt' },
  { name: 'Health', color: '#22c55e', icon: 'heart-pulse' },
  { name: 'Entertainment', color: '#6366f1', icon: 'clapperboard' },
  { name: 'Salary', color: '#16a34a', icon: 'briefcase' },
  { name: 'Other', color: '#64748b', icon: 'tag' },
];

export function isDefaultCategory(name) {
  return DEFAULT_CATEGORIES.some((category) => category.name === name);
}
