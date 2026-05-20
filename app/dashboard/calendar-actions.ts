"use server";

import { revalidatePath } from "next/cache";
import { performMovePlannedRescheduleSession } from "@/lib/move-planned-reschedule-session";
import { performRescheduleSession } from "@/lib/reschedule-session";

function revalidateAfterCalendarSessionChange(
  studentId: string,
  sessionId: string
): void {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath(`/dashboard/students/${studentId}/sessions/${sessionId}`);
  revalidatePath("/dashboard/sessions");
}

export async function rescheduleSessionFromCalendarAction(
  sessionId: string,
  studentId: string,
  session_date: string,
  session_time: string
): Promise<{ error?: string }> {
  const result = await performRescheduleSession({
    sessionId,
    studentId,
    session_date,
    session_time,
  });

  if (result.error) return result;

  if (result.newSessionId) {
    const { syncRescheduleToGoogle } = await import("@/lib/google-calendar");
    await syncRescheduleToGoogle(sessionId, result.newSessionId);
  }

  revalidateAfterCalendarSessionChange(studentId, sessionId);
  return {};
}

export async function movePlannedRescheduleSessionFromCalendarAction(
  sessionId: string,
  studentId: string,
  session_date: string,
  session_time: string
): Promise<{ error?: string }> {
  const result = await performMovePlannedRescheduleSession({
    sessionId,
    studentId,
    session_date,
    session_time,
  });

  if (result.error) return result;

  const { syncSessionMovedToGoogle } = await import("@/lib/google-calendar");
  await syncSessionMovedToGoogle(sessionId);

  revalidateAfterCalendarSessionChange(studentId, sessionId);
  return {};
}
