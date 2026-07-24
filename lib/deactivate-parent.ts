import {
  getUpcomingCancellableSessionsByParentId,
  setStudentsInactiveByParentId,
  updateSessionStatus,
} from "@/lib/db";
import { syncSessionCancelledToGoogle } from "@/lib/google-calendar";
import { isSessionDateTimeBeforeNow } from "@/lib/reschedule-session";

export type DeactivateParentResult =
  | {
      ok: true;
      studentIds: string[];
      sessionsCancelled: number;
    }
  | { error: string; sessionsCancelled?: number };

/**
 * When a parent becomes inactive: inactivate all their students and cancel
 * future/upcoming sessions (Google Calendar events cancelled when linked).
 */
export async function deactivateParentCascade(
  parentId: string
): Promise<DeactivateParentResult> {
  const studentsResult = await setStudentsInactiveByParentId(parentId);
  if ("error" in studentsResult) {
    return { error: studentsResult.error };
  }

  const sessions = await getUpcomingCancellableSessionsByParentId(parentId);
  let sessionsCancelled = 0;

  for (const session of sessions) {
    const timeStr = session.session_time?.slice(0, 8) ?? "";
    if (isSessionDateTimeBeforeNow(session.session_date, timeStr)) {
      continue;
    }

    const updateResult = await updateSessionStatus(session.id, "cancelled");
    if ("error" in updateResult) {
      return {
        error: updateResult.error,
        sessionsCancelled,
      };
    }

    await syncSessionCancelledToGoogle(session.id);
    sessionsCancelled++;
  }

  return {
    ok: true,
    studentIds: studentsResult.studentIds,
    sessionsCancelled,
  };
}
