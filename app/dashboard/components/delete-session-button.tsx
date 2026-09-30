"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteSessionAction,
  type DeleteSessionRedirect,
} from "@/app/dashboard/sessions/actions";
import { MaterialSymbol } from "./material-symbol";

type Props = {
  sessionId: string;
  studentId: string;
  redirectTo: DeleteSessionRedirect;
  sessionLabel: string;
  variant?: "inline" | "button";
};

export function DeleteSessionButton({
  sessionId,
  studentId,
  redirectTo,
  sessionLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function close() {
    if (!pending) setOpen(false);
  }

  function confirmDelete() {
    startTransition(async () => {
      try {
        const result = await deleteSessionAction(
          sessionId,
          studentId,
          redirectTo
        );
        if (result?.error) {
          toast.error(result.error);
          setOpen(false);
        }
      } catch (e) {
        if (
          e &&
          typeof e === "object" &&
          "digest" in e &&
          String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
        ) {
          return;
        }
        toast.error(
          e instanceof Error ? e.message : "Failed to delete session."
        );
        setOpen(false);
      }
    });
  }

  const triggerClass = "btn-icon";
  const iconClass = "text-[16px] leading-none";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className={triggerClass}
        aria-label={`Delete session: ${sessionLabel}`}
        title="Delete session"
      >
        <MaterialSymbol name="delete" className={iconClass} fill />
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
            aria-labelledby="delete-session-title"
            className="fixed text-center left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 surface p-6 shadow-xl"
          >
            <h2
              id="delete-session-title"
              className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Delete session?
            </h2>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {sessionLabel}
              </span>
              ? This will remove it from Google Calendar.
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
                {pending ? "Deleting…" : "Delete session"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
