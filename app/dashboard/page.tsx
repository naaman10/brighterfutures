import { auth } from "@/auth";
import Link from "next/link";
import React from "react";
import {
  getSessionsForDate,
  getSessionsForMonth,
  SESSION_STATUS_LABELS,
} from "@/lib/db";
import { formatDisplayTime } from "@/lib/format";
import { pickBirthdaySessionIdByStudent } from "@/lib/birthday";
import { BirthdayEmoji } from "./components/birthday-emoji";
import { SessionGoogleMeetIcon } from "./components/session-google-meet-icon";
import { DashboardCalendar } from "./components/dashboard-calendar";
import {
  addDaysToDateKey,
  getMonthRange,
  getWeekRange,
  parseMonthParam,
  parseViewParam,
  parseWeekParam,
  todayDateStr,
} from "@/lib/calendar-utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string; week?: string }> | {
    month?: string;
    view?: string;
    week?: string;
  };
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const parsed = parseMonthParam(params?.month);
  const now = new Date();
  const year = parsed?.year ?? now.getFullYear();
  const month = parsed?.month ?? now.getMonth() + 1;
  const monthParam = `${year}-${String(month).padStart(2, "0")}`;
  const view = parseViewParam(params?.view);
  const weekParam = parseWeekParam(params?.week) ?? todayDateStr();
  const session = await auth();
  let sessionsToday: Awaited<ReturnType<typeof getSessionsForDate>> = [];
  let sessionsMonth: Awaited<ReturnType<typeof getSessionsForMonth>> = [];
  let dbError: string | null = null;
  let dbErrorHint: React.ReactNode = null;

  try {
    const monthRange = getMonthRange(year, month);
    const weekRange = getWeekRange(weekParam);
    const calendarPadStart = addDaysToDateKey(weekRange.start, -7);
    const calendarPadEnd = addDaysToDateKey(weekRange.end, 7);
    const start = [monthRange.start, calendarPadStart].sort()[0]!;
    const end = [monthRange.end, calendarPadEnd].sort().reverse()[0]!;
    [sessionsToday, sessionsMonth] = await Promise.all([
      getSessionsForDate(todayDateStr()),
      getSessionsForMonth(start, end),
    ]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load sessions.";
    dbError = msg;
    dbErrorHint = (
      <>
        If the <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">sessions</code> table
        is missing the <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">status</code> column,
        run{" "}
        <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">sql/add-sessions-status.sql</code>{" "}
        in the Neon SQL Editor.
      </>
    );
  }

  const usesWeekFillLayout = view === "week" || view == null;

  return (
    <div
      className={
        usesWeekFillLayout
          ? "flex max-h-[calc(100dvh-7.5rem)] min-h-0 flex-1 flex-col overflow-hidden max-md:h-[calc(100dvh-7.5rem)] md:max-h-none md:overflow-visible"
          : "flex min-h-0 flex-1 flex-col"
      }
    >
      <div
        className={
          usesWeekFillLayout
            ? "max-md:max-h-[38%] max-md:shrink-0 max-md:overflow-y-auto"
            : "shrink-0"
        }
      >
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Dashboard
      </h1>
      <p className="mb-6 text-zinc-600 dark:text-zinc-400">
        Welcome back, {session?.user?.name ?? session?.user?.email}.
      </p>

      {sessionsToday.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Today&apos;s sessions
          </h2>
          <ul className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            {(() => {
              const birthdaySessionIdToTooltip = pickBirthdaySessionIdByStudent(sessionsToday, 5);
              return sessionsToday.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 last:border-b-0 dark:border-zinc-700"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    <span className="inline-flex items-center gap-2">
                      {formatDisplayTime(s.session_time) || "—"}
                      {(() => {
                        const tooltip = birthdaySessionIdToTooltip.get(s.id) ?? null;
                        return tooltip ? <BirthdayEmoji tooltip={tooltip} /> : null;
                      })()}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    {s.subject}
                    <SessionGoogleMeetIcon googleMeetAdded={s.google_meet_added} />
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-500">
                    {s.student_first_name} {s.student_last_name}
                  </span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                    {SESSION_STATUS_LABELS[s.status ?? "planned"]}
                  </span>
                </div>
                <Link
                  href={`/dashboard/students/${s.student_id}/sessions/${s.id}`}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  View session
                </Link>
              </li>
            ));
            })()}
          </ul>
        </section>
      )}

      {dbError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {dbError}
          {dbErrorHint && <p className="mt-2">{dbErrorHint}</p>}
        </div>
      )}
      </div>

      <section
        className={
          usesWeekFillLayout
            ? "flex min-h-0 flex-1 flex-col"
            : undefined
        }
      >
        <DashboardCalendar
          view={view}
          year={year}
          month={month}
          monthParam={monthParam}
          weekParam={weekParam}
          sessions={sessionsMonth}
          fillHeight={usesWeekFillLayout}
        />
      </section>
    </div>
  );
}
