"use client";

import { useState } from "react";
import { toast } from "sonner";
import { sendSessionFeedbackEmailAction } from "./actions";

type Props = {
  sessionId: string;
  studentId: string;
};

export function SendFeedbackButton({ sessionId, studentId }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const result = await sendSessionFeedbackEmailAction(sessionId, studentId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Feedback sent.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
    >
      {loading ? "Sending…" : "Send feedback to parent"}
    </button>
  );
}
