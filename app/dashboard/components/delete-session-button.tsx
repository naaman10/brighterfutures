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
  variant = "inline",
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

  const triggerClass =
    variant === "button"
      ? "inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white p-2 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
      : "inline-flex h-8 w-8 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50";

  const iconClass =
    variant === "button" ? "text-[22px] leading-none" : "text-[20px] leading-none";

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
            className="fixed text-center left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
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
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={pending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
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
