import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionById, getStudentById } from "@/lib/db";
import { formatDisplayDate, formatDisplayDateTime, formatDisplayTime } from "@/lib/format";
import { SendFeedbackButton } from "./send-feedback-button";
import { SessionFeedbackEditor } from "./session-feedback-editor";
import type { EditableSessionStatus } from "@/lib/session-status";
import { SessionStatusSelect } from "./session-status-select";
import { SessionSummaryEditor } from "./session-summary-editor";
import { DeleteSessionButton } from "@/app/dashboard/components/delete-session-button";
import { AddGoogleMeetButton } from "./add-google-meet-button";
import {
  getGoogleCalendarIntegrationStatus,
  getSessionCalendarMeetStatus,
} from "@/lib/google-calendar";
import { isDeleted } from "@/lib/session-status";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string; sessionId: string }> };

export default async function SessionViewPage({ params }: Props) {
  const { id: studentId, sessionId } = await params;
  const [session, student] = await Promise.all([
    getSessionById(sessionId),
    getStudentById(studentId),
  ]);
  if (!session || !student || session.student_id !== studentId) notFound();

  const feedbackSentAtDisplay = formatDisplayDateTime(session.feedback_sent_at);
  const parentEmail = (student.parent_email ?? "").trim();
  const calendarStatus = await getGoogleCalendarIntegrationStatus();
  const canAddGoogleMeet =
    calendarStatus.canSync &&
    !!parentEmail &&
    !isDeleted(session.status) &&
    session.status !== "cancelled";

  let showAddGoogleMeet = canAddGoogleMeet;
  let meetLink: string | undefined;
  if (canAddGoogleMeet && session.google_event_id) {
    const meetStatus = await getSessionCalendarMeetStatus(
      session.google_event_id,
      parentEmail
    );
    if (meetStatus) {
      meetLink = meetStatus.meetLink;
      showAddGoogleMeet =
        !meetStatus.hasMeet || !meetStatus.parentInvited;
    }
  }

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
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Session details
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {showAddGoogleMeet ? (
              <AddGoogleMeetButton sessionId={sessionId} studentId={studentId} />
            ) : null}
            <DeleteSessionButton
              sessionId={sessionId}
              studentId={studentId}
              redirectTo={{ type: "student", studentId }}
              sessionLabel={`${session.subject} on ${formatDisplayDate(session.session_date) || "—"} at ${formatDisplayTime(session.session_time) || "—"}`}
              variant="button"
            />
          </div>
        </div>
        {meetLink ? (
          <p className="mb-4 text-sm">
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Google Meet link →
            </a>
          </p>
        ) : null}
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Status
            </dt>
            <dd className="mt-0.5">
              <SessionStatusSelect
                sessionId={sessionId}
                studentId={studentId}
                currentStatus={(session.status ?? "planned") as EditableSessionStatus}
              />
            </dd>
          </div>
        </dl>
        {session.status !== "rescheduled" && session.status !== "planned_reschedule" ? (
          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <Link
              href={`/dashboard/students/${studentId}/sessions/${sessionId}/reschedule`}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Reschedule session →
            </Link>
          </div>
        ) : null}
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
