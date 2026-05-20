import {
  getSessionById,
  getStudentById,
  getSessionWithStudentNames,
  markSessionSyncSource,
  setSessionGoogleMeetAdded,
} from "@/lib/db";
import { isDeleted } from "@/lib/session-status";
import { getAuthenticatedCalendarClient, isGoogleCalendarConfigured } from "./client";
import { getGoogleCalendarIntegrationStatus } from "./status";
import { isEventParentVisible } from "./events";
import {
  addGoogleMeetAndParentAttendee,
  eventHasGoogleMeet,
  getCalendarEvent,
  parentIsEventAttendee,
} from "./meet";
import { syncSessionCreatedToGoogle } from "./sync-outbound";

export type AddGoogleMeetResult =
  | { ok: true; meetLink?: string; alreadyConfigured?: boolean }
  | { error: string };

export async function addGoogleMeetToSession(
  sessionId: string,
  studentId: string
): Promise<AddGoogleMeetResult> {
  const status = await getGoogleCalendarIntegrationStatus();
  if (!status.canSync) {
    return {
      error: status.issues.join(" ") || "Google Calendar sync is not available.",
    };
  }

  const [session, sessionWithNames, student] = await Promise.all([
    getSessionById(sessionId),
    getSessionWithStudentNames(sessionId),
    getStudentById(studentId),
  ]);
  if (!session || !sessionWithNames || !student || session.student_id !== studentId) {
    return { error: "Session or student not found." };
  }
  if (isDeleted(session.status) || session.status === "cancelled") {
    return { error: "Cannot add Google Meet to a cancelled or deleted session." };
  }

  const parentEmail = (student.parent_email ?? "").trim();
  if (!parentEmail) {
    return { error: "Parent has no email address on file." };
  }

  const parentName =
    (student.parent_name ?? "").trim() ||
    (student.parent_first_name ?? "").trim() ||
    undefined;

  let eventId = session.google_event_id ?? null;
  if (!eventId) {
    const created = await syncSessionCreatedToGoogle(sessionId);
    if ("error" in created) return { error: created.error };
    if ("skipped" in created) {
      return { error: created.skipped };
    }
    eventId = created.eventId ?? null;
    if (!eventId) {
      const refreshed = await getSessionById(sessionId);
      eventId = refreshed?.google_event_id ?? null;
    }
    if (!eventId) {
      return { error: "Could not create a Google Calendar event for this session." };
    }
  }

  const client = await getAuthenticatedCalendarClient();
  if (!client) {
    return { error: "Google Calendar is not connected." };
  }

  if (!isGoogleCalendarConfigured()) {
    return { error: "Google Calendar is not configured." };
  }

  try {
    const existing = await getCalendarEvent(client.calendar, eventId);
    if (
      existing &&
      eventHasGoogleMeet(existing) &&
      parentIsEventAttendee(existing, parentEmail) &&
      isEventParentVisible(existing)
    ) {
      await setSessionGoogleMeetAdded(sessionId, true);
      return { ok: true, alreadyConfigured: true };
    }

    await markSessionSyncSource(sessionId, "app");
    const result = await addGoogleMeetAndParentAttendee(
      client.calendar,
      eventId,
      sessionWithNames,
      studentId,
      parentEmail,
      parentName
    );
    await setSessionGoogleMeetAdded(sessionId, true);
    return { ok: true, meetLink: result.meetLink };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Google Calendar error";
    console.error(`[google-calendar] addGoogleMeetToSession(${sessionId}):`, e);
    return { error: message };
  }
}
