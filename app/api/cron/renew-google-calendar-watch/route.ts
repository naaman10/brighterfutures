import { NextResponse } from "next/server";
import { renewGoogleCalendarWatchIfNeeded } from "@/lib/google-calendar/watch";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await renewGoogleCalendarWatchIfNeeded();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "cron_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
