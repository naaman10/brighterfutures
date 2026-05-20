import {
  createSession,
  getSessionById,
  updateSessionStatus,
} from "@/lib/db";

export type RescheduleSessionInput = {
  sessionId: string;
  studentId: string;
  session_date: string;
  session_time: string;
  subject?: string;
};

/** Reject date/times strictly before now (local). */
export function isSessionDateTimeBeforeNow(
  session_date: string,
  session_time: string
): boolean {
  const normalized = session_time.length === 5 ? `${session_time}:00` : session_time;
  const target = new Date(`${session_date}T${normalized}`);
  return Number.isNaN(target.getTime()) || target.getTime() < Date.now();
}

/**
 * Standard reschedule: mark original as `rescheduled`, create new session as `planned_reschedule`.
 */
export async function performRescheduleSession(
  input: RescheduleSessionInput
): Promise<{ error?: string; newSessionId?: string }> {
  const session = await getSessionById(input.sessionId);
  if (!session || session.student_id !== input.studentId) {
    return { error: "Session not found." };
  }
  if (session.status === "rescheduled" || session.status === "planned_reschedule") {
    return { error: "This session is already rescheduled." };
  }

  const session_date = input.session_date.trim();
  const session_time = input.session_time.trim();
  const subject = input.subject?.trim() || session.subject;

  if (!session_date || !session_time) {
    return { error: "Date and time are required for the new session." };
  }

  if (isSessionDateTimeBeforeNow(session_date, session_time)) {
    return { error: "Sessions cannot be scheduled in the past." };
  }

  const updateResult = await updateSessionStatus(input.sessionId, "rescheduled");
  if ("error" in updateResult) return { error: updateResult.error };

  const createResult = await createSession({
    student_id: input.studentId,
    session_date,
    session_time,
    subject,
    status: "planned_reschedule",
  });
  if ("error" in createResult) {
    return { error: "Original session marked rescheduled but failed to create new session." };
  }

  return { newSessionId: createResult.id };
}
