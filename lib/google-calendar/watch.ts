import { randomUUID } from "crypto";
import {
  getGoogleCalendarWatchChannel,
  upsertGoogleCalendarWatchChannel,
} from "@/lib/db";
import { getAuthenticatedCalendarClient } from "./client";
import {
  getGoogleCalendarId,
  getGoogleWebhookChannelSecret,
  getGoogleWebhookUrl,
} from "./config";

const WATCH_TTL_MS = 6 * 24 * 60 * 60 * 1000; // 6 days (renew before 7-day max)

export async function registerGoogleCalendarWatch(): Promise<{
  ok: true;
} | { error: string }> {
  const calendarId = getGoogleCalendarId();
  if (!calendarId) {
    return { error: "GOOGLE_CALENDAR_ID is not configured." };
  }

  const client = await getAuthenticatedCalendarClient();
  if (!client) {
    return { error: "Google Calendar is not connected." };
  }

  const channelId = randomUUID();
  const expiration = Date.now() + WATCH_TTL_MS;
  const token = getGoogleWebhookChannelSecret();

  try {
    const res = await client.calendar.events.watch({
      calendarId,
      requestBody: {
        id: channelId,
        type: "web_hook",
        address: getGoogleWebhookUrl(),
        token: token || undefined,
        expiration: String(expiration),
      },
    });

    const resourceId = res.data.resourceId;
    if (!resourceId) {
      return { error: "Google watch did not return a resource id." };
    }

    const save = await upsertGoogleCalendarWatchChannel({
      channel_id: channelId,
      resource_id: resourceId,
      calendar_id: calendarId,
      expiration: new Date(expiration),
    });
    if ("error" in save) return { error: save.error };

    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to register watch";
    return { error: message };
  }
}

export async function renewGoogleCalendarWatchIfNeeded(): Promise<void> {
  const channel = await getGoogleCalendarWatchChannel();
  const expiresAt = channel
    ? new Date(channel.expiration).getTime()
    : 0;
  const renewWithin = 24 * 60 * 60 * 1000;
  if (!channel || expiresAt - Date.now() < renewWithin) {
    await registerGoogleCalendarWatch();
  }
}
