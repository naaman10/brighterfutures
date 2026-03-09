"use client";

import { useState } from "react";
import { toast } from "sonner";

type Props = {
  invoiceId: number;
  invoiceNumber: string;
};

export function InvoiceDownloadButton({ invoiceId, invoiceNumber }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!res.ok) {
        const text = await res.text();
        let msg = `Failed to generate PDF (${res.status})`;
        try {
          const json = JSON.parse(text);
          if (json.error) msg = json.error;
        } catch {
          if (text) msg = text.slice(0, 200);
        }
        setError(msg);
        toast.error(msg);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (e) {
      const err = e instanceof Error ? e.message : "Download failed";
      setError(err);
      toast.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <span>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        {loading ? "Generating…" : "Download PDF"}
      </button>
      {error && (
        <span className="ml-2 text-xs text-amber-600 dark:text-amber-400" title={error}>
          Error
        </span>
      )}
    </span>
  );
}
