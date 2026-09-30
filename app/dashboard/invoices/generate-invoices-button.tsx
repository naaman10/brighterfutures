"use client";

import { useState } from "react";
import { generateInvoices } from "./actions";
import { useRouter } from "next/navigation";
import { ActionButton, useActionLock } from "@/app/dashboard/components/action-button";

export function GenerateInvoicesButton() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { pending, run } = useActionLock();
  const router = useRouter();

  async function handleClick() {
    await run(async () => {
      setError(null);
      setMessage(null);
      const result = await generateInvoices();
      if (result.ok && result.message) {
        setMessage(result.message);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to generate invoices.");
      }
    });
  }

  return (
    <>
      <ActionButton
        type="button"
        onClick={handleClick}
        pending={pending}
        pendingLabel="Generating…"
        className="btn-primary"
      >
        Generate invoices for next month
      </ActionButton>
      {message && (
        <span className="text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </span>
      )}
      {error && (
        <span className="text-sm text-amber-700 dark:text-amber-300">
          {error}
        </span>
      )}
    </>
  );
}
