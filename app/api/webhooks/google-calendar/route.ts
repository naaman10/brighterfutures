import { NextResponse } from "next/server";
import { syncFromGoogleCalendar } from "@/lib/google-calendar/sync-inbound";
import { getGoogleWebhookChannelSecret } from "@/lib/google-calendar/config";

export async function POST(request: Request) {
  const secret = getGoogleWebhookChannelSecret();
  if (secret) {
    const token = request.headers.get("x-goog-channel-token");
    if (token !== secret) {
      return new NextResponse(null, { status: 401 });
    }
  }

  const resourceState = request.headers.get("x-goog-resource-state");

  if (resourceState === "sync") {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await syncFromGoogleCalendar();
  } catch (e) {
    console.error("[google-calendar] webhook sync:", e);
  }

  return new NextResponse(null, { status: 204 });
}
