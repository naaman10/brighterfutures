import { auth } from "@/auth";
import Link from "next/link";
import { getParents, getSessionsForDate } from "@/lib/db";
import { formatDisplayTime } from "@/lib/format";
import { ParentAccordion } from "./parent-accordion";

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const session = await auth();
  let parents: Awaited<ReturnType<typeof getParents>> = [];
  let dbError: string | null = null;
  let sessionsToday: Awaited<ReturnType<typeof getSessionsForDate>> = [];

  try {
    [parents, sessionsToday] = await Promise.all([
      getParents(),
      getSessionsForDate(todayDateStr()),
    ]);
  } catch (e) {
    dbError =
      e instanceof Error ? e.message : "Failed to load parents from database.";
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
          <p className="mt-2">
            If the <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">parents</code> table
            doesn&apos;t exist, run{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">sql/create-parents.sql</code>{" "}
            in the Neon SQL Editor.
          </p>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Parents
          </h2>
          <Link
            href="/dashboard/parents/new"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add parent
          </Link>
        </div>
        {parents.length === 0 && !dbError ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            No parents yet. Add rows to the <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">parents</code> table in Neon to see them here.
          </p>
        ) : (
          <ul className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            {parents.map((parent, index) => (
              <ParentAccordion key={parent.id} parent={parent} index={index} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
