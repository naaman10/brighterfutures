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
      className="btn-secondary"
    >
      {loading ? "Sending…" : "Send feedback to parent"}
    </button>
  );
}
