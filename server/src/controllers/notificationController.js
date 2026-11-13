import { asyncHandler } from '../utils/asyncHandler.js';
import {
  deleteNotification, getNotificationPreferences, listNotifications, markAllNotificationsRead,
  evaluateBudgetAlerts, listActiveBudgetAlerts, markNotificationRead, updateNotificationPreferences,
} from '../services/notificationService.js';

export const list = asyncHandler(async (req, res) => {
  res.json({ success: true, ...(await listNotifications(req.user._id, req.query)) });
});

export const activeBudgetAlerts = asyncHandler(async (req, res) => {
  res.json({ success: true, alerts: await listActiveBudgetAlerts(req.user._id) });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await markNotificationRead(req.user._id, req.params.id);
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  return res.json({ success: true, notification });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await markAllNotificationsRead(req.user._id);
  res.json({ success: true });
});

export const remove = asyncHandler(async (req, res) => {
  const notification = await deleteNotification(req.user._id, req.params.id);
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  return res.json({ success: true });
});

export const preferences = asyncHandler(async (req, res) => {
  res.json({ success: true, preferences: await getNotificationPreferences(req.user._id) });
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const preferences = await updateNotificationPreferences(req.user._id, req.body);
  const budgetAlerts = preferences.consentGranted ? await evaluateBudgetAlerts(req.user._id) : [];
  res.json({ success: true, preferences, budgetAlerts });
});
