import Link from "next/link";
import { auth } from "@/auth";
import { getGoogleCalendarConnection } from "@/lib/db";
import {
  getGoogleCalendarId,
  isGoogleCalendarConfigured,
} from "@/lib/google-calendar";

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
  const connection = await getGoogleCalendarConnection();
  const configured = isGoogleCalendarConfigured();
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
          Google Calendar connected successfully.
        </p>
      )}

      {params.error && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Connection error: {params.error}
        </p>
      )}

      <section className="max-w-xl rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Google Calendar
        </h2>

        <dl className="mb-6 space-y-3 text-sm">
          <div>
            <dt className="font-medium text-zinc-500 dark:text-zinc-400">
              Environment configured
            </dt>
            <dd className="text-zinc-900 dark:text-zinc-50">
              {configured ? "Yes" : "No — set GOOGLE_CALENDAR_ID and Google OAuth credentials"}
            </dd>
          </div>
          {calendarId && (
            <div>
              <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                Target calendar ID
              </dt>
              <dd className="break-all font-mono text-xs text-zinc-900 dark:text-zinc-50">
                {calendarId}
              </dd>
            </div>
          )}
          {connection && (
            <>
              <div>
                <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                  Connected as
                </dt>
                <dd className="text-zinc-900 dark:text-zinc-50">
                  {connection.user_email}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                  Status
                </dt>
                <dd className="text-green-700 dark:text-green-400">Connected</dd>
              </div>
            </>
          )}
        </dl>

        {configured ? (
          <a
            href="/api/google-calendar/connect"
            className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {connection ? "Reconnect Google Calendar" : "Connect Google Calendar"}
          </a>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Add <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">GOOGLE_CALENDAR_ID</code> to
            your environment (Calendar settings → Integrate calendar → Calendar ID), then redeploy.
          </p>
        )}

        <div className="mt-6 border-t border-zinc-200 pt-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          <p className="mb-2 font-medium text-zinc-900 dark:text-zinc-50">Sync behaviour</p>
          <ul className="list-inside list-disc space-y-1">
            <li>New sessions create events in your Sessions calendar</li>
            <li>Reschedules update the same event and turn it red</li>
            <li>Cancelled sessions cancel the Google event</li>
            <li>Changes in Google Calendar sync back to the app</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
