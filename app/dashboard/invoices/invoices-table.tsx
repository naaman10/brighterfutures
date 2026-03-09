"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Invoice } from "@/lib/db";
import { InvoiceDownloadButton } from "./invoice-download-button";
import { formatDisplayDate } from "@/lib/format";
import { sendSelectedInvoices, markSelectedInvoicesAsPaid } from "./actions";

type Props = {
  invoices: Invoice[];
};

function formatCurrency(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(n);
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function InvoicesTable({ invoices }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === invoices.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(invoices.map((i) => i.id)));
    }
  };

  async function handleSend() {
    if (selected.size === 0) return;
    setSending(true);
    const ids = Array.from(selected);
    const result = await sendSelectedInvoices(ids);
    setSending(false);
    if (result.ok && result.sent != null) {
      setSelected(new Set());
      router.refresh();
      toast.success(`Sent ${result.sent} invoice${result.sent !== 1 ? "s" : ""}`);
    } else {
      toast.error(result.error ?? "Failed to send invoices");
    }
  }

  async function handleMarkAsPaid() {
    if (selected.size === 0) return;
    setMarkingPaid(true);
    const ids = Array.from(selected);
    const result = await markSelectedInvoicesAsPaid(ids);
    setMarkingPaid(false);
    if (result.ok && result.updated != null) {
      setSelected(new Set());
      router.refresh();
      toast.success(`Marked ${result.updated} invoice${result.updated !== 1 ? "s" : ""} as paid`);
    } else {
      toast.error(result.error ?? "Failed to mark invoices as paid");
    }
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || markingPaid}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            {sending ? "Sending…" : `Send ${selected.size} selected`}
          </button>
          <button
            type="button"
            onClick={handleMarkAsPaid}
            disabled={sending || markingPaid}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {markingPaid ? "Updating…" : "Mark as paid"}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            disabled={sending || markingPaid}
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Clear selection
          </button>
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={invoices.length > 0 && selected.size === invoices.length}
                    onChange={toggleAll}
                    aria-label="Select all invoices"
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Invoice
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Parent
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Billing month
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Due date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(invoice.id)}
                      onChange={() => toggleOne(invoice.id)}
                      aria-label={`Select invoice ${invoice.invoice_number}`}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {invoice.parent_name?.trim() || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                    {formatDisplayDate(invoice.billing_month) || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                    {formatDisplayDate(invoice.due_date) || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        invoice.status === "paid"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : invoice.status === "overdue"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:bg-amber-300"
                            : invoice.status === "sent"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                              : invoice.status === "cancelled"
                                ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {formatStatus(invoice.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <InvoiceDownloadButton
                      invoiceId={invoice.id}
                      invoiceNumber={invoice.invoice_number}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
