import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionById, getStudentById } from "@/lib/db";
import { formatDisplayDate, formatDisplayDateTime, formatDisplayTime } from "@/lib/format";
import { SendFeedbackButton } from "./send-feedback-button";
import { SessionFeedbackEditor } from "./session-feedback-editor";
import { SessionSummaryEditor } from "./session-summary-editor";

type Props = { params: Promise<{ id: string; sessionId: string }> };

export default async function SessionViewPage({ params }: Props) {
  const { id: studentId, sessionId } = await params;
  const [session, student] = await Promise.all([
    getSessionById(sessionId),
    getStudentById(studentId),
  ]);
  if (!session || !student || session.student_id !== studentId) notFound();

  const feedbackSentAtDisplay = formatDisplayDateTime(session.feedback_sent_at);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Dashboard
        </Link>
        <span className="text-zinc-400 dark:text-zinc-500">/</span>
        <Link
          href={`/dashboard/students/${studentId}`}
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          {student.first_name} {student.last_name}
        </Link>
        <span className="text-zinc-400 dark:text-zinc-500">/</span>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Session
        </span>
      </div>

      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Session details
        </h1>
        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Date
            </dt>
            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
              {formatDisplayDate(session.session_date) || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Time
            </dt>
            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
              {formatDisplayTime(session.session_time) || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Subject
            </dt>
            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
              {session.subject}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <SessionSummaryEditor
          sessionId={sessionId}
          studentId={studentId}
          initialSummary={session.summary_markdown}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <SessionFeedbackEditor
          sessionId={sessionId}
          studentId={studentId}
          initialFeedback={session.feedback_markdown}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SendFeedbackButton sessionId={sessionId} studentId={studentId} />
          {feedbackSentAtDisplay && (
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Sent at: {feedbackSentAtDisplay}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
