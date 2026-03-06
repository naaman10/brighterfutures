"use client";

import { useTransition } from "react";
import { SESSION_STATUSES, SESSION_STATUS_LABELS } from "@/lib/session-status";
import type { SessionStatus } from "@/lib/session-status";
import { updateSessionStatusAction } from "./actions";

type Props = {
  sessionId: string;
  studentId: string;
  currentStatus: SessionStatus;
};

export function SessionStatusSelect({ sessionId, studentId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as SessionStatus;
    if (!SESSION_STATUSES.includes(value)) return;
    startTransition(async () => {
      await updateSessionStatusAction(sessionId, studentId, value);
    });
  }

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 disabled:opacity-50"
      aria-label="Session status"
    >
      {SESSION_STATUSES.map((s) => (
        <option key={s} value={s}>
          {SESSION_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
