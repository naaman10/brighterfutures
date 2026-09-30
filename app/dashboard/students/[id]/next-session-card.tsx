"use client";

import { useRef } from "react";
import Link from "next/link";
import { ActionButton, useActionLock } from "@/app/dashboard/components/action-button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Session } from "@/lib/db";
import { formatDisplayDate, formatDisplayDateTime, formatDisplayTime } from "@/lib/format";
import { SESSION_STATUS_LABELS } from "@/lib/session-status";
import {
  completeSessionAction,
  completeSessionAndSendFeedbackAction,
} from "./sessions/[sessionId]/actions";
import {
  SessionFeedbackEditor,
  type SessionFeedbackEditorHandle,
} from "./sessions/[sessionId]/session-feedback-editor";

type Props = {
  studentId: string;
  session: Session | null;
};

export function NextSessionCard({ studentId, session }: Props) {
  const router = useRouter();
  const feedbackRef = useRef<SessionFeedbackEditorHandle>(null);
  const { pending: busy, activeKey, run } = useActionLock<"complete" | "send">();

  if (!session) {
    return (
      <section className="surface bg-peach">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Next session
        </h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          No upcoming session.
        </p>
      </section>
    );
  }

  const feedbackSentAtDisplay = formatDisplayDateTime(session.feedback_sent_at);

  async function handleComplete() {
    if (!session) return;
    await run(async () => {
      const saveResult = await feedbackRef.current?.saveNow();
      if (saveResult?.error) return;
      const result = await completeSessionAction(session.id, studentId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Session completed.");
      router.refresh();
    }, "complete");
  }

  async function handleCompleteAndSend() {
    if (!session) return;
    await run(async () => {
      const saveResult = await feedbackRef.current?.saveNow();
      if (saveResult?.error) return;
      const result = await completeSessionAndSendFeedbackAction(session.id, studentId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Session completed and feedback sent.");
      router.refresh();
    }, "send");
  }

  return (
    <section className="surface bg-peach">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Next session
        </h3>
        <Link
          href={`/dashboard/students/${studentId}/sessions/${session.id}`}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          View session
        </Link>
      </div>

      <dl className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Subject
          </dt>
          <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">{session.subject}</dd>
        </div>
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
            Status
          </dt>
          <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
            {SESSION_STATUS_LABELS[session.status] ?? session.status}
          </dd>
        </div>
      </dl>

      <SessionFeedbackEditor
        key={session.id}
        ref={feedbackRef}
        sessionId={session.id}
        studentId={studentId}
        initialFeedback={session.feedback_markdown}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ActionButton
          type="button"
          onClick={handleComplete}
          pending={activeKey === "complete"}
          pendingLabel="Completing…"
          disabled={busy}
          className="btn-secondary"
        >
          Complete Session
        </ActionButton>
        <ActionButton
          type="button"
          onClick={handleCompleteAndSend}
          pending={activeKey === "send"}
          pendingLabel="Sending…"
          disabled={busy}
          className="btn-primary"
        >
          Complete Session & Send Feedback
        </ActionButton>
        {feedbackSentAtDisplay && (
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Sent at: {feedbackSentAtDisplay}
          </span>
        )}
      </div>
    </section>
  );
}
