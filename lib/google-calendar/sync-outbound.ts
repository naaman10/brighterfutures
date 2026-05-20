import {
  getSessionById,
  getSessionWithStudentNames,
  markSessionSyncSource,
  setSessionGoogleEvent,
} from "@/lib/db";
import { getAuthenticatedCalendarClient, isGoogleCalendarConfigured } from "./client";
import {
  cancelCalendarEvent,
  deleteCalendarEvent,
  insertCalendarEvent,
  patchCalendarEvent,
} from "./events";
import { getGoogleCalendarId } from "./config";

export type SyncResult =
  | { ok: true; eventId?: string }
  | { skipped: string }
  | { error: string };

function logSyncError(context: string, err: unknown): void {
  console.error(`[google-calendar] ${context}:`, err);
}

function formatSyncError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Unknown Google Calendar error";
}

/** Create a Google event for a new session. */
export async function syncSessionCreatedToGoogle(
  sessionId: string
): Promise<SyncResult> {
  if (!isGoogleCalendarConfigured()) {
    return {
      skipped:
        "Google Calendar env not configured (GOOGLE_CALENDAR_ID and OAuth credentials).",
    };
  }

  const session = await getSessionWithStudentNames(sessionId);
  if (!session) return { skipped: "Session not found." };
  if (
    session.status === "rescheduled" ||
    session.status === "cancelled" ||
    session.status === "deleted"
  ) {
    return { skipped: `Session status is ${session.status}.` };
  }
  if (session.google_event_id) {
    return { ok: true, eventId: session.google_event_id };
  }

  const client = await getAuthenticatedCalendarClient();
  if (!client) {
    return {
      skipped:
        "Google Calendar not connected — connect in Dashboard → Settings.",
    };
  }

  const calendarId = getGoogleCalendarId();
  if (!calendarId) return { skipped: "GOOGLE_CALENDAR_ID is not set." };

  try {
    await markSessionSyncSource(sessionId, "app");
    const eventId = await insertCalendarEvent(
      client.calendar,
      session,
      session.student_id
    );
    if (!eventId) return { error: "Google did not return an event id." };

    await setSessionGoogleEvent(sessionId, {
      google_event_id: eventId,
      google_calendar_id: calendarId,
      sync_source: "app",
    });
    return { ok: true, eventId };
  } catch (e) {
    const message = formatSyncError(e);
    logSyncError(`syncSessionCreatedToGoogle(${sessionId})`, e);
    return { error: message };
  }
}

/** Sync all sessions that have no google_event_id (e.g. created before connect). */
export async function backfillSessionsToGoogle(): Promise<{
  synced: number;
  skipped: number;
  errors: string[];
}> {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT id FROM sessions
    WHERE google_event_id IS NULL
      AND status NOT IN ('rescheduled', 'cancelled', 'deleted')
    ORDER BY session_date ASC, session_time ASC
  `;

  let synced = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows as { id: string }[]) {
    const result = await syncSessionCreatedToGoogle(row.id);
    if ("ok" in result && result.ok) synced++;
    else if ("skipped" in result) skipped++;
    else if ("error" in result) errors.push(`${row.id}: ${result.error}`);
  }

  return { synced, skipped, errors };
}

/** After standard reschedule: move event to new session, update time/colour. */
export async function syncRescheduleToGoogle(
  originalSessionId: string,
  newSessionId: string
): Promise<void> {
  if (!isGoogleCalendarConfigured()) return;

  const [original, newSession] = await Promise.all([
    getSessionById(originalSessionId),
    getSessionWithStudentNames(newSessionId),
  ]);
  if (!original || !newSession) return;

  const eventId = original.google_event_id;
  if (!eventId) {
    await syncSessionCreatedToGoogle(newSessionId);
    return;
  }

  const client = await getAuthenticatedCalendarClient();
  if (!client) return;

  const calendarId = getGoogleCalendarId();
  if (!calendarId) return;

  try {
    await markSessionSyncSource(newSessionId, "app");
    await setSessionGoogleEvent(originalSessionId, {
      google_event_id: null,
      sync_source: "app",
    });
    await setSessionGoogleEvent(newSessionId, {
      google_event_id: eventId,
      google_calendar_id: calendarId,
      rescheduled_from_session_id: originalSessionId,
      sync_source: "app",
    });

    await patchCalendarEvent(
      client.calendar,
      eventId,
      newSession,
      newSession.student_id
    );
  } catch (e) {
    logSyncError(
      `syncRescheduleToGoogle(${originalSessionId}, ${newSessionId})`,
      e
    );
  }
}

/** In-place move for planned_reschedule. */
export async function syncSessionMovedToGoogle(sessionId: string): Promise<void> {
  if (!isGoogleCalendarConfigured()) return;

  const session = await getSessionWithStudentNames(sessionId);
  if (!session?.google_event_id) return;

  const client = await getAuthenticatedCalendarClient();
  if (!client) return;

  try {
    await markSessionSyncSource(sessionId, "app");
    await patchCalendarEvent(
      client.calendar,
      session.google_event_id,
      session,
      session.student_id
    );
    await setSessionGoogleEvent(sessionId, {
      google_event_id: session.google_event_id,
      sync_source: "app",
    });
  } catch (e) {
    logSyncError(`syncSessionMovedToGoogle(${sessionId})`, e);
  }
}

/** Remove Google event when session is deleted from the app. */
export async function syncSessionDeletedFromGoogle(
  sessionId: string,
  googleEventId: string
): Promise<SyncResult> {
  if (!isGoogleCalendarConfigured()) {
    return { skipped: "Google Calendar is not configured." };
  }

  const client = await getAuthenticatedCalendarClient();
  if (!client) {
    return { skipped: "Google Calendar is not connected." };
  }

  try {
    await deleteCalendarEvent(client.calendar, googleEventId);
    return { ok: true };
  } catch (e) {
    const message = formatSyncError(e);
    if (message.includes("404") || message.toLowerCase().includes("not found")) {
      return { ok: true };
    }
    logSyncError(`syncSessionDeletedFromGoogle(${sessionId})`, e);
    return { error: message };
  }
}

/** Cancel Google event when session is cancelled. */
export async function syncSessionCancelledToGoogle(
  sessionId: string
): Promise<void> {
  if (!isGoogleCalendarConfigured()) return;

  const session = await getSessionById(sessionId);
  if (!session?.google_event_id) return;

  const client = await getAuthenticatedCalendarClient();
  if (!client) return;

  try {
    await markSessionSyncSource(sessionId, "app");
    await cancelCalendarEvent(client.calendar, session.google_event_id);
    await setSessionGoogleEvent(sessionId, {
      google_event_id: session.google_event_id,
      sync_source: "app",
    });
  } catch (e) {
    logSyncError(`syncSessionCancelledToGoogle(${sessionId})`, e);
  }
}
