"use client";

import { useState } from "react";
import { generateInvoices } from "./actions";
import { useRouter } from "next/navigation";

export function GenerateInvoicesButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await generateInvoices();
    setLoading(false);
    if (result.ok && result.message) {
      setMessage(result.message);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to generate invoices.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? "Generating…" : "Generate invoices for next month"}
      </button>
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
