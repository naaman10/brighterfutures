"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  backfillGoogleCalendarAction,
  verifyGoogleCalendarAction,
} from "./actions";

type Props = {
  configured: boolean;
  connected: boolean;
  canSync: boolean;
  connectedEmail: string | null;
  calendarId: string | null;
  issues: string[];
};

export function GoogleCalendarSettings({
  configured,
  connected,
  canSync,
  connectedEmail,
  calendarId,
  issues,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [lastBackfill, setLastBackfill] = useState<string | null>(null);

  function handleVerify() {
    startTransition(async () => {
      const result = await verifyGoogleCalendarAction();
      if ("error" in result) toast.error(result.error);
      else toast.success("Google Calendar access verified.");
    });
  }

  function handleBackfill() {
    startTransition(async () => {
      const result = await backfillGoogleCalendarAction();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const msg = `Synced ${result.synced} session${result.synced !== 1 ? "s" : ""} to Google Calendar.`;
      setLastBackfill(msg);
      if (result.errors.length > 0) {
        toast.error(`${msg} ${result.errors.length} failed.`);
        console.error("[google-calendar] backfill errors:", result.errors);
      } else {
        toast.success(msg);
      }
    });
  }

  return (
    <section className="max-w-xl rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
        Google Calendar
      </h2>

      {!canSync && issues.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="mb-2 font-medium">Sync is not active yet</p>
          <ul className="list-inside list-disc space-y-1">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <dl className="mb-6 space-y-3 text-sm">
        <div>
          <dt className="font-medium text-zinc-500 dark:text-zinc-400">
            Environment configured
          </dt>
          <dd className="text-zinc-900 dark:text-zinc-50">
            {configured ? "Yes" : "No"}
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
        <div>
          <dt className="font-medium text-zinc-500 dark:text-zinc-400">
            Google account connected
          </dt>
          <dd className="text-zinc-900 dark:text-zinc-50">
            {connected
              ? connectedEmail ?? "Yes"
              : "No — required for events to appear in Google Calendar"}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500 dark:text-zinc-400">
            Ready to sync
          </dt>
          <dd
            className={
              canSync
                ? "text-green-700 dark:text-green-400"
                : "text-amber-700 dark:text-amber-300"
            }
          >
            {canSync ? "Yes" : "No"}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        {configured && (
          <a
            href="/api/google-calendar/connect"
            className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {connected ? "Reconnect Google Calendar" : "Connect Google Calendar"}
          </a>
        )}
        {canSync && (
          <>
            <button
              type="button"
              onClick={handleVerify}
              disabled={pending}
              className="inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Test access
            </button>
            <button
              type="button"
              onClick={handleBackfill}
              disabled={pending}
              className="inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {pending ? "Syncing…" : "Sync existing sessions"}
            </button>
          </>
        )}
      </div>

      {lastBackfill && (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{lastBackfill}</p>
      )}

      <div className="mt-6 border-t border-zinc-200 pt-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        <p className="mb-2 font-medium text-zinc-900 dark:text-zinc-50">Notes</p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            Signing in with Google on the login page is separate — you must also connect
            here.
          </li>
          <li>Sessions created before connecting need “Sync existing sessions”.</li>
          <li>
            The connected account must be able to edit your Sessions calendar.
          </li>
        </ul>
      </div>
    </section>
  );
}
