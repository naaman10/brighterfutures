import Link from "next/link";
import { getStudents } from "@/lib/db";
import { RecordStatusBadge } from "../components/record-status-badge";
import { parseRecordStatus } from "@/lib/record-status";

export const dynamic = "force-dynamic";

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
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Students
      </h1>

      {dbError && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {dbError}
        </div>
      )}

      {!dbError && students.length === 0 ? (
        <p className="surface p-6 text-zinc-500 dark:text-zinc-400">
          No students yet. Add a parent first, then add students from the parent
          or from the Add parent flow.
        </p>
      ) : (
        <div className="overflow-hidden surface p-0">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Parent
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Age
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Sessions
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {student.first_name} {student.last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                    {student.parent_name?.trim() || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <RecordStatusBadge status={parseRecordStatus(student.status)} />
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                    {student.age != null ? student.age : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">View for schedule</td>
                  <td className="px-6 py-4 text-right">
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
