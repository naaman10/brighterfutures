import type { calendar_v3 } from "googleapis";
import type { SessionWithStudentNames } from "@/lib/db";
import {
  GCAL_COLOR_PLANNED_RESCHEDULE,
  getAppBaseUrl,
  getGoogleCalendarId,
  getGoogleCalendarTimezone,
  SESSION_DURATION_MINUTES,
} from "./config";

function normalizeTime(session_time: string): string {
  return session_time.length === 5 ? `${session_time}:00` : session_time;
}

function sessionStartEnd(session: {
  session_date: string;
  session_time: string;
}): { start: string; end: string } {
  const tz = getGoogleCalendarTimezone();
  const time = normalizeTime(session.session_time);
  const start = new Date(`${session.session_date}T${time}`);
  const end = new Date(start.getTime() + SESSION_DURATION_MINUTES * 60 * 1000);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function buildSessionEventPayload(
  session: SessionWithStudentNames,
  studentId: string
): calendar_v3.Schema$Event {
  const { start, end } = sessionStartEnd(session);
  const tz = getGoogleCalendarTimezone();
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
    start: { dateTime: start, timeZone: tz },
    end: { dateTime: end, timeZone: tz },
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

export function parseEventDateTime(
  dt: calendar_v3.Schema$EventDateTime | null | undefined
): { date: string; time: string } | null {
  if (!dt?.dateTime) return null;
  const d = new Date(dt.dateTime);
  if (Number.isNaN(d.getTime())) return null;
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return { date, time };
}
