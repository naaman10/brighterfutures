import { google } from "googleapis";
import {
  getGoogleCalendarConnection,
  upsertGoogleCalendarConnection,
  type GoogleCalendarConnection,
} from "@/lib/db";
import { getGoogleOAuthRedirectUri } from "./config";

export { getGoogleOAuthRedirectUri };

function getOAuth2Client() {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are required.");
  }
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    getGoogleOAuthRedirectUri()
  );
}

export function getGoogleAuthUrl(state: string): string {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    state,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string | undefined;
  expiry_date: number | null | undefined;
}> {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.access_token) {
    throw new Error("Google did not return an access token.");
  }
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? undefined,
    expiry_date: tokens.expiry_date,
  };
}

async function persistRefreshedTokens(
  conn: GoogleCalendarConnection,
  credentials: { access_token?: string | null; expiry_date?: number | null }
): Promise<void> {
  if (!credentials.access_token) return;
  await upsertGoogleCalendarConnection({
    user_email: conn.user_email,
    calendar_id: conn.calendar_id,
    access_token: credentials.access_token,
    refresh_token: conn.refresh_token,
    token_expiry: credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : conn.token_expiry
        ? new Date(conn.token_expiry)
        : null,
  });
}

export async function getAuthenticatedCalendarClient(): Promise<{
  calendar: ReturnType<typeof google.calendar>;
  connection: GoogleCalendarConnection;
} | null> {
  const connection = await getGoogleCalendarConnection();
  if (!connection?.refresh_token) return null;

  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({
    access_token: connection.access_token ?? undefined,
    refresh_token: connection.refresh_token,
    expiry_date: connection.token_expiry
      ? new Date(connection.token_expiry).getTime()
      : undefined,
  });

  oauth2.on("tokens", (tokens) => {
    void persistRefreshedTokens(connection, tokens);
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2 });
  return { calendar, connection };
}

export function isGoogleCalendarConfigured(): boolean {
  return !!(
    process.env.AUTH_GOOGLE_ID &&
    process.env.AUTH_GOOGLE_SECRET &&
    process.env.GOOGLE_CALENDAR_ID?.trim()
  );
}
