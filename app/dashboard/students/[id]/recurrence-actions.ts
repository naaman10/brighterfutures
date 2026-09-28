"use server";

import { revalidatePath } from "next/cache";
import { applySeriesEdit } from "@/lib/apply-session-recurrence";
import { isRecurrenceInterval } from "@/lib/session-recurrence";

export async function updateSessionRecurrenceAction(
  studentId: string,
  recurrenceId: string,
  formData: FormData
): Promise<{ error?: string; calendarWarning?: string }> {
  const subject = (formData.get("subject") as string) ?? "";
  const intervalRaw = (formData.get("interval") as string)?.trim() ?? "";
  if (!isRecurrenceInterval(intervalRaw)) return { error: "Invalid interval." };
  const dayOfWeek = Number.parseInt((formData.get("day_of_week") as string) ?? "", 10);
  const sessionTime = (formData.get("session_time") as string) ?? "";
  const endDate = (formData.get("end_date") as string) ?? "";
  const occurrenceRaw = (formData.get("month_weekday_occurrence") as string)?.trim();
  const monthWeekdayOccurrence = occurrenceRaw ? Number.parseInt(occurrenceRaw, 10) : null;

  const result = await applySeriesEdit({
    studentId,
    recurrenceId,
    subject,
    interval: intervalRaw,
    dayOfWeek,
    monthWeekdayOccurrence:
      monthWeekdayOccurrence != null && Number.isNaN(monthWeekdayOccurrence)
        ? null
        : monthWeekdayOccurrence,
    sessionTime,
    endDate,
  });
  if (result.error) return result;

  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sessions");
  return result;
}
