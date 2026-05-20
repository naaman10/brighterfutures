import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { upsertGoogleCalendarConnection } from "@/lib/db";
import {
  exchangeCodeForTokens,
  getGoogleOAuthRedirectUri,
} from "@/lib/google-calendar/client";
import { getGoogleCalendarId } from "@/lib/google-calendar/config";
import { registerGoogleCalendarWatch } from "@/lib/google-calendar/watch";

export async function GET(request: Request) {
  const baseUrl = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=${encodeURIComponent(error)}`, baseUrl)
    );
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("gcal_oauth_state")?.value;
  cookieStore.delete("gcal_oauth_state");

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=invalid_oauth_state", baseUrl)
    );
  }

  const calendarId = getGoogleCalendarId();
  if (!calendarId) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=calendar_not_configured", baseUrl)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/settings?error=missing_refresh_token",
          baseUrl
        )
      );
    }

    const oauth2 = new google.auth.OAuth2(
      process.env.AUTH_GOOGLE_ID,
      process.env.AUTH_GOOGLE_SECRET,
      getGoogleOAuthRedirectUri()
    );
    oauth2.setCredentials({ access_token: tokens.access_token });
    const oauth2api = google.oauth2({ version: "v2", auth: oauth2 });
    const userInfo = await oauth2api.userinfo.get();
    const email = userInfo.data.email;
    if (!email) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?error=no_email", baseUrl)
      );
    }

    const save = await upsertGoogleCalendarConnection({
      user_email: email,
      calendar_id: calendarId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    });
    if ("error" in save) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings?error=${encodeURIComponent(save.error)}`,
          baseUrl
        )
      );
    }

    const watch = await registerGoogleCalendarWatch();
    if ("error" in watch) {
      console.error("[google-calendar] watch registration:", watch.error);
    }

    return NextResponse.redirect(
      new URL("/dashboard/settings?connected=1", baseUrl)
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "oauth_failed";
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=${encodeURIComponent(message)}`, baseUrl)
    );
  }
}
