import { auth } from "@/auth";
import Link from "next/link";
import React from "react";
import {
  getSessionsForDate,
  getSessionsForMonth,
  SESSION_STATUS_LABELS,
} from "@/lib/db";
import { formatDisplayTime } from "@/lib/format";
import { MonthCalendar } from "./components/month-calendar";

export const dynamic = "force-dynamic";

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function parseMonthParam(param: string | undefined): { year: number; month: number } | null {
  if (!param || !/^\d{4}-\d{2}$/.test(param)) return null;
  const [y, m] = param.split("-").map(Number);
  if (m < 1 || m > 12) return null;
  return { year: y, month: m };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }> | { month?: string };
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const parsed = parseMonthParam(params?.month);
  const now = new Date();
  const year = parsed?.year ?? now.getFullYear();
  const month = parsed?.month ?? now.getMonth() + 1;
  const session = await auth();
  let sessionsToday: Awaited<ReturnType<typeof getSessionsForDate>> = [];
  let sessionsMonth: Awaited<ReturnType<typeof getSessionsForMonth>> = [];
  let dbError: string | null = null;
  let dbErrorHint: React.ReactNode = null;

  try {
    const { start, end } = getMonthRange(year, month);
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

  return (
    <div>
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
            {sessionsToday.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 last:border-b-0 dark:border-zinc-700"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {formatDisplayTime(s.session_time) || "—"}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {s.subject}
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
            ))}
          </ul>
        </section>
      )}

      {dbError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {dbError}
          {dbErrorHint && <p className="mt-2">{dbErrorHint}</p>}
        </div>
      )}

      <section>
        <MonthCalendar year={year} month={month} sessions={sessionsMonth} />
      </section>
    </div>
  );
}
