import type { calendar_v3 } from "googleapis";
import type { SessionWithStudentNames } from "@/lib/db";
import {
  addMinutesToGoogleDateTime,
  googleEventToSessionDateTime,
  sessionToGoogleDateTime,
} from "./datetime";
import {
  GCAL_COLOR_PLANNED_RESCHEDULE,
  getAppBaseUrl,
  getGoogleCalendarId,
  SESSION_DURATION_MINUTES,
} from "./config";

/** Set on calendar events once a parent is invited — keeps internal fields off the description. */
export const PARENT_VISIBLE_EXT_PROP = "parentVisible";

export const GOOGLE_MEET_TITLE_PREFIX = "💻 ";

export function buildSessionEventTitle(
  session: SessionWithStudentNames,
  options?: { withMeetEmoji?: boolean }
): string {
  const base = `${session.subject} – ${session.student_first_name} ${session.student_last_name}`;
  const stripped = base.startsWith(GOOGLE_MEET_TITLE_PREFIX)
    ? base.slice(GOOGLE_MEET_TITLE_PREFIX.length)
    : base;
  if (options?.withMeetEmoji) {
    return `${GOOGLE_MEET_TITLE_PREFIX}${stripped}`;
  }
  return stripped;
}

export function isEventParentVisible(
  event: calendar_v3.Schema$Event | null | undefined
): boolean {
  return event?.extendedProperties?.private?.[PARENT_VISIBLE_EXT_PROP] === "1";
}

/** Description safe for parents invited to the calendar event. */
export function buildParentVisibleEventDescription(
  session: SessionWithStudentNames
): string {
  return `Student: ${session.student_first_name} ${session.student_last_name}`;
}

/** Full description for internal calendar use (before parent invite). */
export function buildInternalEventDescription(
  session: SessionWithStudentNames,
  studentId: string
): string {
  const baseUrl = getAppBaseUrl();
  return [
    buildParentVisibleEventDescription(session),
    `Status: ${session.status}`,
    `View in app: ${baseUrl}/dashboard/students/${studentId}/sessions/${session.id}`,
  ].join("\n");
}

export function buildSessionEventDescription(
  session: SessionWithStudentNames,
  studentId: string,
  options?: { parentVisible?: boolean }
): string {
  if (options?.parentVisible) {
    return buildParentVisibleEventDescription(session);
  }
  return buildInternalEventDescription(session, studentId);
}

export async function getCalendarEvent(
  calendar: calendar_v3.Calendar,
  eventId: string
): Promise<calendar_v3.Schema$Event | null> {
  const calendarId = getGoogleCalendarId();
  if (!calendarId) return null;

  const res = await calendar.events.get({
    calendarId,
    eventId,
  });
  return res.data;
}

export function buildSessionEventPayload(
  session: SessionWithStudentNames,
  studentId: string,
  options?: { parentVisible?: boolean }
): calendar_v3.Schema$Event {
  const start = sessionToGoogleDateTime(session.session_date, session.session_time);
  const endDateTime = addMinutesToGoogleDateTime(
    start.dateTime,
    SESSION_DURATION_MINUTES
  );
  const title = buildSessionEventTitle(session, {
    withMeetEmoji: options?.parentVisible,
  });
  const description = buildSessionEventDescription(session, studentId, options);

  const privateProps: Record<string, string> = {
    sessionId: session.id,
    studentId,
    appStatus: session.status,
  };
  if (options?.parentVisible) {
    privateProps[PARENT_VISIBLE_EXT_PROP] = "1";
  }

  const event: calendar_v3.Schema$Event = {
    summary: title,
    description,
    start: { dateTime: start.dateTime, timeZone: start.timeZone },
    end: { dateTime: endDateTime, timeZone: start.timeZone },
    extendedProperties: {
      private: privateProps,
    },
  };

  if (session.status === "planned_reschedule") {
    event.colorId = GCAL_COLOR_PLANNED_RESCHEDULE;
  }

  return event;
}

export async function insertCalendarEvent(
  calendar: calendar_v3.Calendar,
  session: SessionWithStudentNames,
  studentId: string
): Promise<string | null> {
  const calendarId = getGoogleCalendarId();
  if (!calendarId) return null;

  const res = await calendar.events.insert({
    calendarId,
    requestBody: buildSessionEventPayload(session, studentId),
  });
  return res.data.id ?? null;
}

export async function patchCalendarEvent(
  calendar: calendar_v3.Calendar,
  eventId: string,
  session: SessionWithStudentNames,
  studentId: string
): Promise<void> {
  const calendarId = getGoogleCalendarId();
  if (!calendarId) return;

  const existing = await getCalendarEvent(calendar, eventId);
  const parentVisible = isEventParentVisible(existing);

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: buildSessionEventPayload(session, studentId, { parentVisible }),
  });
}

export async function cancelCalendarEvent(
  calendar: calendar_v3.Calendar,
  eventId: string
): Promise<void> {
  const calendarId = getGoogleCalendarId();
  if (!calendarId) return;

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: { status: "cancelled" },
  });
}

export async function deleteCalendarEvent(
  calendar: calendar_v3.Calendar,
  eventId: string
): Promise<void> {
  const calendarId = getGoogleCalendarId();
  if (!calendarId) return;

  await calendar.events.delete({
    calendarId,
    eventId,
  });
}

export function parseEventDateTime(
  dt: calendar_v3.Schema$EventDateTime | null | undefined
): { date: string; time: string } | null {
  if (!dt?.dateTime) return null;
  return googleEventToSessionDateTime(dt.dateTime, dt.timeZone);
}
