import type { calendar_v3 } from "googleapis";
import {
  getGoogleCalendarWatchChannel,
  getSessionByGoogleEventId,
  getSessionById,
  markSessionSyncSource,
  setGoogleCalendarWatchSyncToken,
  setSessionGoogleEvent,
  updateSessionStatus,
} from "@/lib/db";
import { performMovePlannedRescheduleSession } from "@/lib/move-planned-reschedule-session";
import { performRescheduleSession } from "@/lib/reschedule-session";
import { getAuthenticatedCalendarClient } from "./client";
import { getGoogleCalendarId } from "./config";
import { parseEventDateTime } from "./events";

const LOOP_GUARD_MS = 8000;

function shouldSkipInboundSync(session: {
  sync_source?: string | null;
  updated_at?: string | Date | null;
}): boolean {
  if (session.sync_source !== "app") return false;
  if (!session.updated_at) return false;
  const updated = new Date(session.updated_at).getTime();
  return Date.now() - updated < LOOP_GUARD_MS;
}

async function processChangedEvent(
  event: calendar_v3.Schema$Event
): Promise<void> {
  if (!event.id) return;

  const sessionIdFromProps = event.extendedProperties?.private?.sessionId;
  let session =
    (await getSessionByGoogleEventId(event.id)) ??
    (sessionIdFromProps
      ? await getSessionById(sessionIdFromProps)
      : null);

  if (!session) return;
  if (shouldSkipInboundSync(session)) {
    await markSessionSyncSource(session.id, null);
    return;
  }

  if (event.status === "cancelled") {
    if (session.status === "cancelled" || session.status === "rescheduled") {
      return;
    }
    await markSessionSyncSource(session.id, "google");
    await updateSessionStatus(session.id, "cancelled");
    await setSessionGoogleEvent(session.id, {
      google_event_id: event.id,
      sync_source: "google",
    });
    return;
  }

  const parsed = parseEventDateTime(event.start);
  if (!parsed) return;

  const sameTime =
    session.session_date === parsed.date &&
    session.session_time.slice(0, 5) === parsed.time;

  if (sameTime) return;

  await markSessionSyncSource(session.id, "google");

  if (session.status === "planned_reschedule") {
    await performMovePlannedRescheduleSession({
      sessionId: session.id,
      studentId: session.student_id,
      session_date: parsed.date,
      session_time: parsed.time,
    });
    await setSessionGoogleEvent(session.id, {
      google_event_id: event.id,
      sync_source: "google",
    });
    return;
  }

  if (
    session.status === "planned" ||
    session.status === "in_progress"
  ) {
    const result = await performRescheduleSession({
      sessionId: session.id,
      studentId: session.student_id,
      session_date: parsed.date,
      session_time: parsed.time,
      subject: session.subject,
    });
    if (result.error) {
      console.error("[google-calendar] inbound reschedule:", result.error);
      return;
    }
    if (result.newSessionId) {
      await setSessionGoogleEvent(result.newSessionId, {
        google_event_id: event.id,
        google_calendar_id: getGoogleCalendarId(),
        rescheduled_from_session_id: session.id,
        sync_source: "google",
      });
      await setSessionGoogleEvent(session.id, {
        google_event_id: null,
        sync_source: "google",
      });
    }
  }
}

export async function syncFromGoogleCalendar(): Promise<void> {
  const calendarId = getGoogleCalendarId();
  if (!calendarId) return;

  const client = await getAuthenticatedCalendarClient();
  if (!client) return;

  const watch = await getGoogleCalendarWatchChannel();
  let syncToken = watch?.sync_token ?? undefined;

  try {
    const res = await client.calendar.events.list({
      calendarId,
      syncToken,
      showDeleted: true,
      singleEvents: true,
    });

    const items = res.data.items ?? [];
    for (const event of items) {
      await processChangedEvent(event);
    }

    if (res.data.nextSyncToken) {
      await setGoogleCalendarWatchSyncToken(res.data.nextSyncToken);
    }
  } catch (e: unknown) {
    const err = e as { code?: number };
    if (err?.code === 410 && syncToken) {
      await setGoogleCalendarWatchSyncToken(null);
      await syncFromGoogleCalendar();
      return;
    }
    console.error("[google-calendar] syncFromGoogleCalendar:", e);
  }
}
