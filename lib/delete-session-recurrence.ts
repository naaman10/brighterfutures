import {
  getRecurrenceById,
  getSessionsByRecurrenceId,
  markRecurrenceAsDeleted,
} from "@/lib/db";
import { performDeleteSession } from "@/lib/delete-session";
import { isSessionDateTimeBeforeNow } from "@/lib/reschedule-session";
import { isDeleted } from "@/lib/session-status";
import { isDeletedRecurrence } from "@/lib/session-recurrence";

const KEEP_SESSION_STATUSES = new Set(["completed", "rescheduled"]);

function isSubsequentSessionToDelete(session: {
  session_date: string;
  session_time: string;
  status: string;
}): boolean {
  if (isDeleted(session.status) || KEEP_SESSION_STATUSES.has(session.status)) {
    return false;
  }
  // Past cancellations stay in the student history. They are already hidden on the calendar.
  if (session.status === "cancelled") {
    return !isSessionDateTimeBeforeNow(session.session_date, session.session_time);
  }
  // Still-scheduled sessions are removed even when their start time has passed.
  // Leaving them as planned kept deleted series on the calendar.
  return true;
}

export async function performDeleteSessionRecurrence(
  recurrenceId: string,
  studentId: string
): Promise<{ error?: string; deletedSessions?: number }> {
  const recurrence = await getRecurrenceById(recurrenceId);
  if (!recurrence || recurrence.student_id !== studentId) {
    return { error: "Recurrence not found." };
  }
  if (isDeletedRecurrence(recurrence.status)) {
    return { error: "This series has already been deleted." };
  }

  const sessions = await getSessionsByRecurrenceId(recurrenceId);
  const subsequent = sessions.filter(isSubsequentSessionToDelete);

  let deletedSessions = 0;
  for (const session of subsequent) {
    const result = await performDeleteSession(session.id, studentId);
    if (result.error) {
      return {
        error:
          deletedSessions > 0
            ? `${result.error} (${deletedSessions} session${deletedSessions !== 1 ? "s" : ""} deleted before this error.)`
            : result.error,
        deletedSessions,
      };
    }
    deletedSessions++;
  }

  const deleteResult = await markRecurrenceAsDeleted(recurrenceId);
  if ("error" in deleteResult) return { error: deleteResult.error, deletedSessions };

  return { deletedSessions };
}
