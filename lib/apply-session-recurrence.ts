import {
  createSession,
  getRecurrenceById,
  getSessionsByRecurrenceId,
  updateSessionRecurrence,
  updateSessionSchedule,
  updateSessionStatus,
} from "@/lib/db";
import {
  syncSessionCancelledToGoogle,
  syncSessionCreatedToGoogle,
  syncSessionMovedToGoogle,
} from "@/lib/google-calendar";
import { londonCalendarDate } from "@/lib/next-session";
import {
  isRecurrenceInterval,
  normalizeSessionTime,
  planSeriesEdit,
  type RecurrenceInterval,
} from "@/lib/session-recurrence";

export type SeriesEditInput = {
  studentId: string;
  recurrenceId: string;
  subject: string;
  interval: RecurrenceInterval;
  dayOfWeek: number;
  monthWeekdayOccurrence: number | null;
  sessionTime: string;
  endDate: string;
};

export async function applySeriesEdit(
  input: SeriesEditInput
): Promise<{ error?: string; calendarWarning?: string }> {
  const recurrence = await getRecurrenceById(input.recurrenceId);
  if (!recurrence || recurrence.student_id !== input.studentId) {
    return { error: "Recurrence not found." };
  }
  const subject = input.subject.trim();
  if (!subject) return { error: "Subject is required." };
  if (!isRecurrenceInterval(input.interval)) return { error: "Invalid interval." };
  if (input.dayOfWeek < 0 || input.dayOfWeek > 6) return { error: "Invalid day of week." };
  const sessionTime = normalizeSessionTime(input.sessionTime);
  if (!/^\d{2}:\d{2}$/.test(sessionTime)) return { error: "Time is required." };
  const endDate = input.endDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return { error: "End date is required." };
  if (endDate < recurrence.start_date.slice(0, 10)) {
    return { error: "End date must be on or after the series start date." };
  }
  const monthWeekdayOccurrence =
    input.interval === "monthly" ? input.monthWeekdayOccurrence ?? 1 : null;
  if (
    input.interval === "monthly" &&
    (monthWeekdayOccurrence == null ||
      monthWeekdayOccurrence < 1 ||
      monthWeekdayOccurrence > 5)
  ) {
    return { error: "Choose which weekday of the month." };
  }

  const sessions = await getSessionsByRecurrenceId(input.recurrenceId);
  const plan = planSeriesEdit({
    today: londonCalendarDate(),
    startDate: recurrence.start_date.slice(0, 10),
    endDate,
    dayOfWeek: input.dayOfWeek,
    interval: input.interval,
    monthWeekdayOccurrence,
    sessionTime,
    subject,
    sessions,
  });

  const updated = await updateSessionRecurrence(input.recurrenceId, {
    subject,
    interval: input.interval,
    day_of_week: input.dayOfWeek,
    month_weekday_occurrence: monthWeekdayOccurrence,
    session_time: sessionTime,
    end_date: endDate,
  });
  if ("error" in updated) return { error: updated.error };

  for (const change of plan.updates) {
    const result = await updateSessionSchedule(change.id, change);
    if ("error" in result) return { error: result.error };
  }
  const createdIds: string[] = [];
  for (const created of plan.creates) {
    const result = await createSession({
      student_id: input.studentId,
      session_date: created.session_date,
      session_time: sessionTime,
      subject,
      status: "planned",
      recurrence_id: input.recurrenceId,
    });
    if ("error" in result) return { error: result.error };
    createdIds.push(result.id);
  }
  for (const sessionId of plan.cancels) {
    const result = await updateSessionStatus(sessionId, "cancelled");
    if ("error" in result) return { error: result.error };
  }

  const warnings: string[] = [];
  for (const change of plan.updates) {
    await syncSessionMovedToGoogle(change.id);
  }
  for (const sessionId of createdIds) {
    const syncResult = await syncSessionCreatedToGoogle(sessionId);
    if ("error" in syncResult) warnings.push(syncResult.error);
  }
  for (const sessionId of plan.cancels) {
    await syncSessionCancelledToGoogle(sessionId);
  }

  if (warnings.length > 0) {
    return { calendarWarning: `Series saved, but Google Calendar: ${warnings[0]}` };
  }
  return {};
}
