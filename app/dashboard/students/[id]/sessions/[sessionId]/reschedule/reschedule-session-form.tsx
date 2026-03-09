"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { rescheduleSessionAction } from "../actions";

type Props = {
  sessionId: string;
  studentId: string;
  defaultSubject: string;
};

export function RescheduleSessionForm({
  sessionId,
  studentId,
  defaultSubject,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await rescheduleSessionAction(sessionId, studentId, formData);
    setPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Session rescheduled. A new session has been created.");
    router.push(`/dashboard/students/${studentId}/sessions/${sessionId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label
          htmlFor="session_date"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          New date *
        </label>
        <input
          id="session_date"
          name="session_date"
          type="date"
          required
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label
          htmlFor="session_time"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          New time *
        </label>
        <input
          id="session_time"
          name="session_time"
          type="time"
          required
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label
          htmlFor="subject"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          defaultValue={defaultSubject}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          {pending ? "Rescheduling…" : "Reschedule session"}
        </button>
        <Link
          href={`/dashboard/students/${studentId}/sessions/${sessionId}`}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
