import { getSessionById, updateSessionDateTime } from "@/lib/db";
import { isSessionDateTimeBeforeNow } from "@/lib/reschedule-session";

export type MovePlannedRescheduleInput = {
  sessionId: string;
  studentId: string;
  session_date: string;
  session_time: string;
};

/** Move an existing planned_reschedule session to a new date/time (in-place update). */
export async function performMovePlannedRescheduleSession(
  input: MovePlannedRescheduleInput
): Promise<{ error?: string }> {
  const session = await getSessionById(input.sessionId);
  if (!session || session.student_id !== input.studentId) {
    return { error: "Session not found." };
  }
  if (session.status !== "planned_reschedule") {
    return { error: "Only planned reschedule sessions can be moved this way." };
  }

  const session_date = input.session_date.trim();
  const session_time = input.session_time.trim();

  if (!session_date || !session_time) {
    return { error: "Date and time are required." };
  }

  if (isSessionDateTimeBeforeNow(session_date, session_time)) {
    return { error: "Sessions cannot be scheduled in the past." };
  }

  const updateResult = await updateSessionDateTime(
    input.sessionId,
    session_date,
    session_time
  );
  if ("error" in updateResult) return { error: updateResult.error };

  return {};
}
