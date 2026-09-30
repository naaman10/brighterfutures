"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteSessionRecurrenceAction } from "./recurrence-actions";

type Props = {
  studentId: string;
  recurrenceId: string;
  seriesLabel: string;
};

export function DeleteRecurrenceButton({
  studentId,
  recurrenceId,
  seriesLabel,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function close() {
    if (!pending) setOpen(false);
  }

  function confirmDelete() {
    startTransition(async () => {
      try {
        const result = await deleteSessionRecurrenceAction(studentId, recurrenceId);
        if (result?.error) {
          toast.error(result.error);
          setOpen(false);
          return;
        }
        toast.success("Recurring series deleted.");
        setOpen(false);
        router.refresh();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to delete recurring series."
        );
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className="btn-danger-outline"
      >
        Delete series
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-recurrence-title"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 surface p-6 text-center shadow-xl"
          >
            <h2
              id="delete-recurrence-title"
              className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Delete recurring series?
            </h2>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {seriesLabel}
              </span>
              ? Scheduled sessions in this series will be removed from the app and
              Google Calendar. Completed sessions will be kept.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={pending}
                className="btn-danger"
              >
                {pending ? "Deleting…" : "Delete series"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
