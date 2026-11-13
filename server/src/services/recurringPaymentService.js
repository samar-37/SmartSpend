import mongoose from 'mongoose';
import RecurringPayment from '../models/RecurringPayment.js';
import RecurringOccurrence from '../models/RecurringOccurrence.js';
import Transaction from '../models/Transaction.js';
import { evaluateBudgetAlerts } from './notificationService.js';
import { parseAmountToMinor, formatMinorAmount } from '../utils/money.js';
import { dateKey, nextOccurrence, occurrenceDates, parseDateOnly } from '../utils/recurrence.js';

function serialize(schedule) {
  const item = schedule.toObject ? schedule.toObject() : schedule;
  return { ...item, id: item._id.toString(), amount: formatMinorAmount(item.amountMinor), startDate: dateKey(item.startDate), endDate: item.endDate ? dateKey(item.endDate) : null, nextOccurrence: item.nextOccurrence ? dateKey(item.nextOccurrence) : null };
}

function occurrenceDateValid(schedule, occurrenceDate) {
  return occurrenceDates({ ...schedule.toObject(), endDate: occurrenceDate }, occurrenceDate, 2400)
    .some((item) => dateKey(item) === dateKey(occurrenceDate));
}

async function advanceSchedule(schedule, date) {
  schedule.nextOccurrence = nextOccurrence(schedule, new Date(date.getTime() + 86400000));
  await schedule.save();
}

async function claimOccurrence(userId, schedule, date) {
  try {
    return await RecurringOccurrence.create({
      userId,
      recurringPaymentId: schedule._id,
      occurrenceDate: date,
      status: 'processing',
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const existing = await RecurringOccurrence.findOne({ userId, recurringPaymentId: schedule._id, occurrenceDate: date });
    if (!existing || ['processed', 'skipped', 'deleted'].includes(existing.status)) return null;
    if (existing.status === 'processing') {
      const transaction = await Transaction.findOne({ userId, recurringPaymentId: schedule._id, recurringOccurrenceDate: date });
      const stale = existing.updatedAt < new Date(Date.now() - 10 * 60 * 1000);
      if (!transaction && !stale) return null;
    }
    existing.status = 'processing';
    existing.failureReason = '';
    await existing.save();
    return existing;
  }
}

function toModelData(data) {
  return { ...data, amountMinor: parseAmountToMinor(String(data.amount)), startDate: parseDateOnly(data.startDate), endDate: data.endDate ? parseDateOnly(data.endDate) : null };
}

async function findSchedule(userId, id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return RecurringPayment.findOne({ _id: id, userId });
}

export async function listSchedules(userId) {
  const schedules = await RecurringPayment.find({ userId }).sort({ status: 1, nextOccurrence: 1, createdAt: -1 });
  schedules.forEach((schedule) => { schedule.nextOccurrence = nextOccurrence(schedule); });
  return schedules.map(serialize);
}

export async function createSchedule(userId, data) {
  const modelData = toModelData(data);
  const schedule = await RecurringPayment.create({ ...modelData, userId });
  schedule.nextOccurrence = nextOccurrence(schedule);
  await schedule.save();
  return serialize(schedule);
}

export async function updateSchedule(userId, id, data) {
  const schedule = await findSchedule(userId, id);
  if (!schedule) return null;
  const updates = { ...data };
  if (updates.amount !== undefined) updates.amountMinor = parseAmountToMinor(String(updates.amount));
  if (updates.startDate) updates.startDate = parseDateOnly(updates.startDate);
  if (updates.endDate !== undefined) updates.endDate = updates.endDate ? parseDateOnly(updates.endDate) : null;
  delete updates.amount;
  Object.assign(schedule, updates);
  schedule.nextOccurrence = nextOccurrence(schedule);
  await schedule.save();
  return serialize(schedule);
}

export async function setStatus(userId, id, status) {
  const schedule = await findSchedule(userId, id);
  if (!schedule) return null;
  schedule.status = status;
  schedule.nextOccurrence = nextOccurrence(schedule);
  await schedule.save();
  return serialize(schedule);
}

export async function deleteSchedule(userId, id) {
  const schedule = await findSchedule(userId, id);
  if (!schedule) return null;
  schedule.status = 'cancelled';
  schedule.nextOccurrence = null;
  await schedule.save();
  return serialize(schedule);
}

export async function listUpcoming(userId) {
  const schedules = await RecurringPayment.find({ userId, status: 'active' }).sort({ nextOccurrence: 1 });
  schedules.forEach((schedule) => { schedule.nextOccurrence = nextOccurrence(schedule); });
  return schedules.map((schedule) => ({ schedule: serialize(schedule), occurrenceDate: schedule.nextOccurrence ? dateKey(schedule.nextOccurrence) : null, status: 'expected' })).filter((item) => item.occurrenceDate);
}

export async function listHistory(userId, id) {
  const schedule = await findSchedule(userId, id);
  if (!schedule) return null;
  const occurrences = await RecurringOccurrence.find({ userId, recurringPaymentId: schedule._id }).sort({ occurrenceDate: -1 }).lean();
  const dates = occurrenceDates(schedule, new Date());
  const known = new Map(occurrences.map((item) => [dateKey(item.occurrenceDate), item]));
  const history = dates.map((date) => {
    const occurrence = known.get(dateKey(date));
    return {
      occurrenceDate: dateKey(date),
      status: occurrence?.status || 'scheduled',
      transactionId: occurrence?.transactionId?.toString() || null,
      failureReason: occurrence?.failureReason || '',
    };
  });
  return {
    schedule: serialize(schedule),
    totalRecorded: occurrences.filter((item) => item.status === 'processed').length,
    previousPaymentDate: occurrences.find((item) => item.status === 'processed')?.occurrenceDate ? dateKey(occurrences.find((item) => item.status === 'processed').occurrenceDate) : null,
    history,
  };
}

async function processOccurrence(userId, schedule, occurrenceDate) {
  const date = occurrenceDate instanceof Date ? new Date(occurrenceDate) : parseDateOnly(occurrenceDate);
  const occurrence = await claimOccurrence(userId, schedule, date);
  if (!occurrence) {
    const existing = await RecurringOccurrence.findOne({ userId, recurringPaymentId: schedule._id, occurrenceDate: date }).lean();
    return { transactionId: existing?.transactionId?.toString() || null, occurrenceDate: dateKey(date), status: existing?.status || 'scheduled' };
  }
  try {
    let transaction;
    try {
      transaction = await Transaction.create({
        userId, title: schedule.title, amountMinor: schedule.amountMinor, type: schedule.type, category: schedule.category,
        date, paymentMethod: schedule.paymentMethod, notes: schedule.notes, recurringPaymentId: schedule._id, recurringOccurrenceDate: date,
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      transaction = await Transaction.findOne({ userId, recurringPaymentId: schedule._id, recurringOccurrenceDate: date });
    }
    occurrence.status = 'processed';
    occurrence.transactionId = transaction._id;
    occurrence.processedAt = new Date();
    await occurrence.save();
    await advanceSchedule(schedule, date);
    if (schedule.type === 'expense') await evaluateBudgetAlerts(userId, [dateKey(date).slice(0, 7)]);
    return { transactionId: transaction._id.toString(), occurrenceDate: dateKey(date), status: 'processed' };
  } catch (error) {
    occurrence.status = 'failed';
    occurrence.failureReason = error.message || 'Unable to create transaction';
    await occurrence.save();
    throw error;
  }
}

export async function recordOccurrence(userId, id, occurrenceDate) {
  const schedule = await findSchedule(userId, id);
  if (!schedule || schedule.status === 'cancelled') return null;
  const date = parseDateOnly(occurrenceDate);
  if (!date || date < schedule.startDate || (schedule.endDate && date > schedule.endDate)) {
    const error = new Error('Occurrence date is outside the schedule');
    error.statusCode = 400;
    throw error;
  }
  if (!occurrenceDateValid(schedule, date)) {
    const error = new Error('Occurrence date does not match the recurrence');
    error.statusCode = 400;
    throw error;
  }
  return processOccurrence(userId, schedule, date);
}

export async function skipOccurrence(userId, id, occurrenceDate) {
  const schedule = await findSchedule(userId, id);
  if (!schedule || schedule.status === 'cancelled') return null;
  const date = parseDateOnly(occurrenceDate);
  if (!date || !occurrenceDateValid(schedule, date)) {
    const error = new Error('Occurrence date does not match the recurrence');
    error.statusCode = 400;
    throw error;
  }
  try {
    await RecurringOccurrence.create({ userId, recurringPaymentId: schedule._id, occurrenceDate: date, status: 'skipped' });
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
  await advanceSchedule(schedule, date);
  return { occurrenceDate: dateKey(date), status: 'skipped' };
}

export async function markOccurrenceDeleted(userId, recurringPaymentId, occurrenceDate) {
  if (!recurringPaymentId || !occurrenceDate) return;
  await RecurringOccurrence.findOneAndUpdate(
    { userId, recurringPaymentId, occurrenceDate: parseDateOnly(dateKey(occurrenceDate)) },
    { $set: { status: 'deleted', transactionId: null } },
  );
}

export async function runRecurringPaymentJobs() {
  const today = parseDateOnly(new Date().toISOString().slice(0, 10));
  const schedules = await RecurringPayment.find({ status: 'active', nextOccurrence: { $lte: today } });
  for (const schedule of schedules) {
    try {
      let occurrence = schedule.nextOccurrence;
      while (occurrence && occurrence <= today && schedule.status === 'active') {
        await processOccurrence(schedule.userId, schedule, occurrence);
        occurrence = schedule.nextOccurrence;
      }
    } catch (error) {
      console.error(`Recurring payment processing failed for ${schedule._id}`, error);
    }
  }
}
