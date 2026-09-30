"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ActionButton, useActionLock } from "@/app/dashboard/components/action-button";
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
  const { pending, run } = useActionLock();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    await run(async () => {
      const result = await rescheduleSessionAction(sessionId, studentId, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Session rescheduled. A new session has been created.");
      router.push(`/dashboard/students/${studentId}/sessions/${sessionId}`);
      router.refresh();
    });
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
        <ActionButton
          type="submit"
          pending={pending}
          pendingLabel="Rescheduling…"
          className="btn-primary"
        >
          Reschedule session
        </ActionButton>
        <Link
          href={`/dashboard/students/${studentId}/sessions/${sessionId}`}
          className="btn-secondary"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
