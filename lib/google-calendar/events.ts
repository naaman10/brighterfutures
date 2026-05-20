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

export function buildSessionEventPayload(
  session: SessionWithStudentNames,
  studentId: string
): calendar_v3.Schema$Event {
  const start = sessionToGoogleDateTime(session.session_date, session.session_time);
  const endDateTime = addMinutesToGoogleDateTime(
    start.dateTime,
    SESSION_DURATION_MINUTES
  );
  const baseUrl = getAppBaseUrl();
  const title = `${session.subject} – ${session.student_first_name} ${session.student_last_name}`;
  const description = [
    `Student: ${session.student_first_name} ${session.student_last_name}`,
    `Status: ${session.status}`,
    `View in app: ${baseUrl}/dashboard/students/${studentId}/sessions/${session.id}`,
  ].join("\n");

  const event: calendar_v3.Schema$Event = {
    summary: title,
    description,
    start: { dateTime: start.dateTime, timeZone: start.timeZone },
    end: { dateTime: endDateTime, timeZone: start.timeZone },
    extendedProperties: {
      private: {
        sessionId: session.id,
        studentId,
        appStatus: session.status,
      },
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

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: buildSessionEventPayload(session, studentId),
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
