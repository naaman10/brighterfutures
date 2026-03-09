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
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
    </div>
  );
}
