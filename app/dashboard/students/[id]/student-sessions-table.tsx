"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Session } from "@/lib/db";
import { SESSION_STATUS_LABELS } from "@/lib/session-status";
import { pickBirthdaySessionIdForStudent } from "@/lib/birthday";
import { formatDisplayDate, formatDisplayTime } from "@/lib/format";
import { BirthdayEmoji } from "../../components/birthday-emoji";
import { SessionGoogleMeetIcon } from "../../components/session-google-meet-icon";
import { DeleteSessionButton } from "../../components/delete-session-button";
import { deleteSelectedSessionsAction } from "../../sessions/actions";

type Props = {
  studentId: string;
  sessions: Session[];
  studentDob: string | null;
};

function sessionLabel(session: Session): string {
  return `${session.subject} on ${formatDisplayDate(session.session_date) || "—"} at ${formatDisplayTime(session.session_time) || "—"}`;
}

export function StudentSessionsTable({ studentId, sessions, studentDob }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const birthdayPick = pickBirthdaySessionIdForStudent(sessions, studentDob, 5);

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === sessions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sessions.map((s) => s.id)));
    }
  };

  function closeDeleteConfirm() {
    if (!deleting) setShowDeleteConfirm(false);
  }

  async function handleDeleteConfirmed() {
    if (selected.size === 0) return;
    setDeleting(true);
    const ids = Array.from(selected);
    const result = await deleteSelectedSessionsAction(studentId, ids);
    setDeleting(false);
    setShowDeleteConfirm(false);
    if (result.ok && result.deleted != null) {
      setSelected(new Set());
      router.refresh();
      toast.success(
        `Deleted ${result.deleted} session${result.deleted !== 1 ? "s" : ""}`
      );
    } else {
      toast.error(result.error ?? "Failed to delete sessions");
    }
  }

  if (sessions.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        No sessions yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Delete selected ({selected.size})
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            disabled={deleting}
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Clear selection
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden
            onClick={closeDeleteConfirm}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-sessions-title"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <h2
              id="delete-sessions-title"
              className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Delete sessions?
            </h2>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to delete {selected.size} selected session
              {selected.size !== 1 ? "s" : ""}? This will remove them from Google Calendar
              when linked.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={deleting}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete sessions"}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={sessions.length > 0 && selected.size === sessions.length}
                  onChange={toggleAll}
                  aria-label="Select all sessions"
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Time
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
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(session.id)}
                    onChange={() => toggleOne(session.id)}
                    aria-label={`Select session ${sessionLabel(session)}`}
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                  <div className="flex items-center gap-2">
                    <span>{formatDisplayDate(session.session_date) || "—"}</span>
                    {birthdayPick?.sessionId === session.id && (
                      <BirthdayEmoji tooltip={birthdayPick.tooltip} />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                  {formatDisplayTime(session.session_time) || "—"}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                  <span className="inline-flex items-center gap-1.5">
                    {session.subject}
                    <SessionGoogleMeetIcon googleMeetAdded={session.google_meet_added} />
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {SESSION_STATUS_LABELS[session.status ?? "planned"]}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/dashboard/students/${studentId}/sessions/${session.id}`}
                      className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      View
                    </Link>
                    <DeleteSessionButton
                      sessionId={session.id}
                      studentId={studentId}
                      redirectTo={{ type: "student", studentId }}
                      sessionLabel={sessionLabel(session)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
