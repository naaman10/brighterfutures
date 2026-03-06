import Link from "next/link";
import { getStudents } from "@/lib/db";
import { formatDisplayDate, formatDisplayTime } from "@/lib/format";

export default async function StudentsPage() {
  let students: Awaited<ReturnType<typeof getStudents>> = [];
  let dbError: string | null = null;

  try {
    students = await getStudents();
  } catch (e) {
    dbError =
      e instanceof Error ? e.message : "Failed to load students from database.";
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Students
      </h1>

      {dbError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {dbError}
        </div>
      )}

      {!dbError && students.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-6 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          No students yet. Add a parent first, then add students from the parent
          or from the Add parent flow.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Parent
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Age
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Start date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Start time
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {student.first_name} {student.last_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {student.parent_name?.trim() || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                    {student.age != null ? student.age : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                    {formatDisplayDate(student.start_date) || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                    {formatDisplayTime(student.start_time) || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/students/${student.id}`}
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
