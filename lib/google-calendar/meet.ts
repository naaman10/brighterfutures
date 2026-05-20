import { randomUUID } from "crypto";
import type { calendar_v3 } from "googleapis";
import { getAuthenticatedCalendarClient } from "./client";
import { getGoogleCalendarId } from "./config";

export function eventHasGoogleMeet(event: calendar_v3.Schema$Event): boolean {
  if (event.hangoutLink) return true;
  const entryPoints = event.conferenceData?.entryPoints ?? [];
  return entryPoints.some(
    (e) => e.entryPointType === "video" && !!e.uri
  );
}

export function parentIsEventAttendee(
  event: calendar_v3.Schema$Event,
  parentEmail: string | null | undefined
): boolean {
  if (!parentEmail?.trim()) return false;
  const normalized = parentEmail.trim().toLowerCase();
  return (event.attendees ?? []).some(
    (a) => (a.email ?? "").trim().toLowerCase() === normalized
  );
}

export function getMeetLinkFromEvent(
  event: calendar_v3.Schema$Event
): string | undefined {
  if (event.hangoutLink) return event.hangoutLink;
  const video = event.conferenceData?.entryPoints?.find(
    (e) => e.entryPointType === "video"
  );
  return video?.uri ?? undefined;
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

export async function getSessionCalendarMeetStatus(
  googleEventId: string,
  parentEmail: string | null | undefined
): Promise<{ hasMeet: boolean; parentInvited: boolean; meetLink?: string } | null> {
  const client = await getAuthenticatedCalendarClient();
  if (!client) return null;

  try {
    const event = await getCalendarEvent(client.calendar, googleEventId);
    if (!event) return null;
    return {
      hasMeet: eventHasGoogleMeet(event),
      parentInvited: parentIsEventAttendee(event, parentEmail),
      meetLink: getMeetLinkFromEvent(event),
    };
  } catch {
    return null;
  }
}

export async function addGoogleMeetAndParentAttendee(
  calendar: calendar_v3.Calendar,
  eventId: string,
  parentEmail: string,
  parentDisplayName?: string | null
): Promise<{ meetLink?: string; parentInvited: boolean; meetAdded: boolean }> {
  const calendarId = getGoogleCalendarId();
  if (!calendarId) {
    throw new Error("GOOGLE_CALENDAR_ID is not set.");
  }

  const existing = await getCalendarEvent(calendar, eventId);
  if (!existing) {
    throw new Error("Google Calendar event not found.");
  }

  const hasMeet = eventHasGoogleMeet(existing);
  const normalizedParent = parentEmail.trim().toLowerCase();
  const attendees = [...(existing.attendees ?? [])];
  const parentAlreadyInvited = attendees.some(
    (a) => (a.email ?? "").trim().toLowerCase() === normalizedParent
  );

  if (!parentAlreadyInvited) {
    attendees.push({
      email: parentEmail.trim(),
      displayName: parentDisplayName?.trim() || undefined,
      responseStatus: "needsAction",
    });
  }

  const requestBody: calendar_v3.Schema$Event = { attendees };

  let conferenceDataVersion: number | undefined;
  if (!hasMeet) {
    conferenceDataVersion = 1;
    requestBody.conferenceData = {
      createRequest: {
        requestId: randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const needsNotification = !parentAlreadyInvited;

  const res = await calendar.events.patch({
    calendarId,
    eventId,
    conferenceDataVersion,
    sendUpdates: needsNotification ? "all" : "none",
    requestBody,
  });

  return {
    meetLink: getMeetLinkFromEvent(res.data),
    parentInvited: parentAlreadyInvited || needsNotification,
    meetAdded: !hasMeet,
  };
}
