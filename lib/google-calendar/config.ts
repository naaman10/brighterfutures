/** Google Calendar integration configuration (env). */

export function getAppBaseUrl(): string {
  return (
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function getGoogleCalendarId(): string | null {
  const id = process.env.GOOGLE_CALENDAR_ID?.trim();
  return id || null;
}

export function getGoogleCalendarTimezone(): string {
  return process.env.GOOGLE_CALENDAR_TIMEZONE?.trim() || "Europe/London";
}

export function getGoogleWebhookUrl(): string {
  return `${getAppBaseUrl()}/api/webhooks/google-calendar`;
}

export function getGoogleWebhookChannelSecret(): string {
  return process.env.GOOGLE_WEBHOOK_CHANNEL_SECRET?.trim() || "";
}

export function getGoogleOAuthRedirectUri(): string {
  return `${getAppBaseUrl()}/api/google-calendar/callback`;
}

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
];

/** Google Calendar colorId for planned reschedule (tomato/red). */
export const GCAL_COLOR_PLANNED_RESCHEDULE = "11";

export const SESSION_DURATION_MINUTES = 60;
