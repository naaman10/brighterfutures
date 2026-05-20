import {
  getSessionById,
  getSessionWithStudentNames,
  markSessionSyncSource,
  setSessionGoogleEvent,
} from "@/lib/db";
import { getAuthenticatedCalendarClient, isGoogleCalendarConfigured } from "./client";
import {
  cancelCalendarEvent,
  insertCalendarEvent,
  patchCalendarEvent,
} from "./events";
import { getGoogleCalendarId } from "./config";

function logSyncError(context: string, err: unknown): void {
  console.error(`[google-calendar] ${context}:`, err);
}

/** Create a Google event for a new session. */
export async function syncSessionCreatedToGoogle(
  sessionId: string
): Promise<void> {
  if (!isGoogleCalendarConfigured()) return;

  const session = await getSessionWithStudentNames(sessionId);
  if (!session) return;
  if (session.status === "rescheduled" || session.status === "cancelled") return;
  if (session.google_event_id) return;

  const client = await getAuthenticatedCalendarClient();
  if (!client) return;

  const calendarId = getGoogleCalendarId();
  if (!calendarId) return;

  try {
    await markSessionSyncSource(sessionId, "app");
    const eventId = await insertCalendarEvent(
      client.calendar,
      session,
      session.student_id
    );
    if (!eventId) return;

    await setSessionGoogleEvent(sessionId, {
      google_event_id: eventId,
      google_calendar_id: calendarId,
      sync_source: "app",
    });
  } catch (e) {
    logSyncError(`syncSessionCreatedToGoogle(${sessionId})`, e);
  }
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
