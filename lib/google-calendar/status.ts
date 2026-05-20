import { getGoogleCalendarConnection } from "@/lib/db";
import { getGoogleCalendarId } from "./config";
import { getAuthenticatedCalendarClient, isGoogleCalendarConfigured } from "./client";

export type GoogleCalendarIntegrationStatus = {
  configured: boolean;
  calendarIdSet: boolean;
  connected: boolean;
  connectedEmail: string | null;
  canSync: boolean;
  issues: string[];
};

export async function getGoogleCalendarIntegrationStatus(): Promise<GoogleCalendarIntegrationStatus> {
  const configured = isGoogleCalendarConfigured();
  const calendarId = getGoogleCalendarId();
  const calendarIdSet = !!calendarId;
  const connection = await getGoogleCalendarConnection();
  const connected = !!connection?.refresh_token;
  const issues: string[] = [];

  if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
    issues.push("AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET are not set.");
  }
  if (!calendarIdSet) {
    issues.push("GOOGLE_CALENDAR_ID is not set (your Sessions calendar ID).");
  }
  if (!connected) {
    issues.push(
      "Google Calendar is not connected — open Settings and click “Connect Google Calendar”."
    );
  }
  if (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL) {
    issues.push(
      "AUTH_URL is not set — OAuth redirect may fail locally (use http://localhost:3000)."
    );
  }

  const canSync = configured && connected;

  return {
    configured,
    calendarIdSet,
    connected,
    connectedEmail: connection?.user_email ?? null,
    canSync,
    issues,
  };
}

/** Verify API access by listing one event on the target calendar. */
export async function verifyGoogleCalendarAccess(): Promise<
  { ok: true } | { error: string }
> {
  const status = await getGoogleCalendarIntegrationStatus();
  if (!status.canSync) {
    return { error: status.issues.join(" ") || "Calendar sync is not ready." };
  }

  const calendarId = getGoogleCalendarId();
  if (!calendarId) return { error: "GOOGLE_CALENDAR_ID is missing." };

  const client = await getAuthenticatedCalendarClient();
  if (!client) return { error: "Could not authenticate with Google." };

  try {
    await client.calendar.events.list({
      calendarId,
      maxResults: 1,
      singleEvents: true,
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Calendar API error";
    if (message.includes("404") || message.toLowerCase().includes("not found")) {
      return {
        error:
          "Calendar not found — check GOOGLE_CALENDAR_ID and that the connected Google account can edit the Sessions calendar.",
      };
    }
    if (message.includes("403") || message.toLowerCase().includes("forbidden")) {
      return {
        error:
          "Permission denied — reconnect Google Calendar and ensure the account can edit the Sessions calendar.",
      };
    }
    return { error: message };
  }
}
