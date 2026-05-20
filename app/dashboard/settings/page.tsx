import Link from "next/link";
import { auth } from "@/auth";
import { getGoogleCalendarIntegrationStatus } from "@/lib/google-calendar";
import { getGoogleCalendarId } from "@/lib/google-calendar/config";
import { GoogleCalendarSettings } from "./google-calendar-settings";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    connected?: string;
    error?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: Props) {
  await auth();
  const params = await searchParams;
  const status = await getGoogleCalendarIntegrationStatus();
  const calendarId = getGoogleCalendarId();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Dashboard
        </Link>
      </div>

      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Settings
      </h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">
        Connect Google Calendar to sync tutoring sessions with your Sessions calendar.
      </p>

      {params.connected === "1" && (
        <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
          Google Calendar connected successfully. Use “Sync existing sessions” below for
          sessions created before connecting.
        </p>
      )}

      {params.error && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Connection error: {params.error}
        </p>
      )}

      <GoogleCalendarSettings
        configured={status.configured}
        connected={status.connected}
        canSync={status.canSync}
        connectedEmail={status.connectedEmail}
        calendarId={calendarId}
        issues={status.issues}
      />
    </div>
  );
}
