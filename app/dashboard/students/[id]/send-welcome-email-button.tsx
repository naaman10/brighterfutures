"use client";

import { useState } from "react";
import { toast } from "sonner";
import { resendWelcomeEmail, sendWelcomeEmail } from "./actions";

type Props = {
  studentId: string;
  variant?: "send" | "resend";
};

export function SendWelcomeEmailButton({ studentId, variant = "send" }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const action = variant === "resend" ? resendWelcomeEmail : sendWelcomeEmail;
  const buttonLabel = variant === "resend" ? "Resend welcome email" : "Send welcome email";

  async function handleClick() {
    setMessage(null);
    setLoading(true);
    try {
      const result = await action(studentId);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        toast.success(variant === "resend" ? "Welcome email resent." : "Welcome email sent.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="btn-secondary"
      >
        {loading ? "Sending…" : buttonLabel}
      </button>
      {message && (
        <p
          className={
            message.type === "error"
              ? "text-sm text-red-600 dark:text-red-400"
              : "text-sm text-green-600 dark:text-green-400"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
