import {
  getSessionById,
  markSessionAsDeleted,
  setSessionGoogleEvent,
} from "@/lib/db";
import { isDeleted } from "@/lib/session-status";
import { syncSessionDeletedFromGoogle } from "@/lib/google-calendar";

export async function performDeleteSession(
  sessionId: string,
  studentId: string
): Promise<{ error?: string }> {
  const session = await getSessionById(sessionId);
  if (!session || session.student_id !== studentId) {
    return { error: "Session not found." };
  }
  if (isDeleted(session.status)) {
    return { error: "Session is already deleted." };
  }

  if (session.google_event_id) {
    const syncResult = await syncSessionDeletedFromGoogle(
      sessionId,
      session.google_event_id
    );
    if ("error" in syncResult) {
      return {
        error: `Could not remove session from Google Calendar: ${syncResult.error}`,
      };
    }
    await setSessionGoogleEvent(sessionId, {
      google_event_id: null,
      sync_source: "app",
    });
  }

  const deleteResult = await markSessionAsDeleted(sessionId);
  if ("error" in deleteResult) return { error: deleteResult.error };

  return {};
}
