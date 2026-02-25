import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudentById, getSessionsByStudentId } from "@/lib/db";
import { formatDisplayDate, formatDisplayDateTime, formatDisplayTime } from "@/lib/format";
import { AddSessionForm } from "./add-session-form";
import { SendWelcomeEmailButton } from "./send-welcome-email-button";
import { StudentAISummary } from "./student-ai-summary";

type Props = { params: Promise<{ id: string }> };

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params;
  const [student, sessions] = await Promise.all([
    getStudentById(id),
    getSessionsByStudentId(id),
  ]);
  if (!student) notFound();

  const startDateDisplay = formatDisplayDate(student.start_date) || "—";
  const startTimeDisplay = formatDisplayTime(student.start_time) || "—";

  const canSendWelcome =
    student.start_date != null &&
    student.start_time != null &&
    (student.first_name ?? "").trim() !== "" &&
    (student.parent_email ?? "").trim() !== "" &&
    (student.parent_first_name ?? "").trim() !== "" &&
    student.welcome === false;

  const welcomeSentAtDisplay = formatDisplayDateTime(student.welcome_sent_at);

  const canResendWelcome =
    student.welcome &&
    student.start_date != null &&
    student.start_time != null &&
    (student.first_name ?? "").trim() !== "" &&
    (student.parent_email ?? "").trim() !== "" &&
    (student.parent_first_name ?? "").trim() !== "";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Dashboard
        </Link>
        <Link
          href={`/dashboard/students/${id}/edit`}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Update details
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {student.first_name} {student.last_name}
      </h1>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <dl className="space-y-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Age
            </dt>
            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
              {student.age != null ? student.age : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Start date
            </dt>
            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
              {startDateDisplay}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Start time
            </dt>
            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
              {startTimeDisplay}
            </dd>
          </div>
          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Parent
            </dt>
            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
              {student.parent_name ?? "—"}
            </dd>
            {student.parent_email && (
              <dd className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                {student.parent_email}
              </dd>
            )}
          </div>
          {(canSendWelcome || student.welcome) && (
            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
              <dd className="mt-2 space-y-2">
                {canSendWelcome && <SendWelcomeEmailButton studentId={id} />}
                {student.welcome && welcomeSentAtDisplay && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Sent on {welcomeSentAtDisplay}
                  </p>
                )}
                {canResendWelcome && (
                  <SendWelcomeEmailButton studentId={id} variant="resend" />
                )}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-8 rounded-xl bg-black p-6 text-white">
        <h2 className="mb-3 text-lg font-medium text-white">
          AI summary
        </h2>
        <p className="mb-4 text-sm text-zinc-300">
          Generate a summary of the student&apos;s progress and recommended focus areas from all session summaries and feedback.
        </p>
        <StudentAISummary studentId={id} initialSummary={student.ai_summary} />
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Sessions
          </h2>
        </div>
        <div className="mb-6">
          <AddSessionForm studentId={id} />
        </div>
        {sessions.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No sessions yet.
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
                    Subject
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
                      {session.subject}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/students/${id}/sessions/${session.id}`}
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
      </section>
    </div>
  );
}
