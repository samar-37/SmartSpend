import { asyncHandler } from '../utils/asyncHandler.js';
import { createSchedule, deleteSchedule, listHistory, listSchedules, listUpcoming, recordOccurrence, setStatus, skipOccurrence, updateSchedule } from '../services/recurringPaymentService.js';

export const list = asyncHandler(async (req, res) => res.json({ success: true, schedules: await listSchedules(req.user._id) }));
export const upcoming = asyncHandler(async (req, res) => res.json({ success: true, upcoming: await listUpcoming(req.user._id) }));
export const create = asyncHandler(async (req, res) => res.status(201).json({ success: true, schedule: await createSchedule(req.user._id, req.body) }));
export const update = asyncHandler(async (req, res) => {
  const schedule = await updateSchedule(req.user._id, req.params.id, req.body);
  if (!schedule) { const error = new Error('Recurring payment not found'); error.statusCode = 404; throw error; }
  res.json({ success: true, schedule });
});
async function respondWithSchedule(action, req, res) {
  const schedule = await action();
  if (!schedule) { const error = new Error('Recurring payment not found'); error.statusCode = 404; throw error; }
  res.json({ success: true, schedule });
}
export const pause = asyncHandler(async (req, res) => respondWithSchedule(() => setStatus(req.user._id, req.params.id, 'paused'), req, res));
export const resume = asyncHandler(async (req, res) => respondWithSchedule(() => setStatus(req.user._id, req.params.id, 'active'), req, res));
export const cancel = asyncHandler(async (req, res) => respondWithSchedule(() => deleteSchedule(req.user._id, req.params.id), req, res));
export const history = asyncHandler(async (req, res) => {
  const result = await listHistory(req.user._id, req.params.id);
  if (!result) { const error = new Error('Recurring payment not found'); error.statusCode = 404; throw error; }
  res.json({ success: true, ...result });
});
export const record = asyncHandler(async (req, res) => {
  const result = await recordOccurrence(req.user._id, req.params.id, req.params.date);
  if (!result) { const error = new Error('Recurring payment not found'); error.statusCode = 404; throw error; }
  res.status(201).json({ success: true, ...result });
});
export const skip = asyncHandler(async (req, res) => {
  const result = await skipOccurrence(req.user._id, req.params.id, req.params.date);
  if (!result) { const error = new Error('Recurring payment not found'); error.statusCode = 404; throw error; }
  res.json({ success: true, ...result });
});
