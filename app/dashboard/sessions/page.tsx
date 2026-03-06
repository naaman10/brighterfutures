import Link from "next/link";
import { getSessions, SESSION_STATUS_LABELS } from "@/lib/db";
import { formatDisplayDate, formatDisplayTime } from "@/lib/format";

export default async function SessionsPage() {
  let sessions: Awaited<ReturnType<typeof getSessions>> = [];
  let dbError: string | null = null;

  try {
    sessions = await getSessions();
  } catch (e) {
    dbError =
      e instanceof Error ? e.message : "Failed to load sessions from database.";
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Sessions
      </h1>

      {dbError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {dbError}
        </div>
      )}

      {!dbError && sessions.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-6 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          No sessions yet. Add sessions from a student&apos;s page.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                    {formatDisplayDate(session.session_date) || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                    {formatDisplayTime(session.session_time) || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                    <Link
                      href={`/dashboard/students/${session.student_id}`}
                      className="font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      {session.student_first_name} {session.student_last_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                    {session.subject}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {SESSION_STATUS_LABELS[session.status ?? "planned"]}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/students/${session.student_id}/sessions/${session.id}`}
                      className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
