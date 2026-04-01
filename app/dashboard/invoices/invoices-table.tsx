"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Invoice } from "@/lib/db";
import { InvoiceDownloadButton } from "./invoice-download-button";
import { formatDisplayDate } from "@/lib/format";
import {
  sendSelectedInvoices,
  sendPaymentReminders,
  markSelectedInvoicesAsPaid,
  deleteSelectedInvoices,
  regenerateSelectedInvoices,
  cancelSelectedInvoices,
  updateInvoiceDiscountAction,
} from "./actions";
import { EditDiscountModal } from "./edit-discount-modal";

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

function formatDiscountDisplay(invoice: Invoice): string {
  const amount = Number(invoice.discount_amount);
  const pct = Number(invoice.discount_pct);
  const hasAmount = !Number.isNaN(amount) && amount > 0;
  const hasPct = !Number.isNaN(pct) && pct > 0;
  if (!hasAmount && !hasPct) return "—";
  const parts: string[] = [];
  if (hasAmount) parts.push(formatCurrency(String(amount)));
  if (hasPct) parts.push(`${pct}%`);
  return parts.join(" / ");
}

function discountHasValue(invoice: Invoice): boolean {
  const amount = Number(invoice.discount_amount);
  const pct = Number(invoice.discount_pct);
  return (!Number.isNaN(amount) && amount > 0) || (!Number.isNaN(pct) && pct > 0);
}

const LOCKED_STATUSES = ["issued", "paid"];

export function InvoicesTable({ invoices }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [discountInvoice, setDiscountInvoice] = useState<Invoice | null>(null);

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

  async function handleSendReminder() {
    if (selected.size === 0) return;
    setSendingReminder(true);
    const ids = Array.from(selected);
    const result = await sendPaymentReminders(ids);
    setSendingReminder(false);
    if (result.ok && result.sent != null) {
      setSelected(new Set());
      router.refresh();
      toast.success(
        `Sent ${result.sent} payment reminder${result.sent !== 1 ? "s" : ""}`
      );
    } else {
      toast.error(result.error ?? "Failed to send payment reminders");
    }
  }

  function openDeleteConfirm() {
    setShowDeleteConfirm(true);
  }

  function closeDeleteConfirm() {
    if (!deleting) setShowDeleteConfirm(false);
  }

  async function handleDeleteConfirmed() {
    if (selected.size === 0) return;
    setDeleting(true);
    const ids = Array.from(selected);
    const result = await deleteSelectedInvoices(ids);
    setDeleting(false);
    setShowDeleteConfirm(false);
    if (result.ok && result.deleted != null) {
      setSelected(new Set());
      router.refresh();
      toast.success(`Deleted ${result.deleted} invoice${result.deleted !== 1 ? "s" : ""}`);
    } else {
      toast.error(result.error ?? "Failed to delete invoices");
    }
  }

  async function handleRegenerateConfirmed() {
    if (selected.size === 0) return;
    setRegenerating(true);
    const ids = Array.from(selected);
    const result = await regenerateSelectedInvoices(ids);
    setRegenerating(false);
    setShowRegenerateConfirm(false);
    if (result.regenerated != null && result.regenerated > 0) {
      setSelected(new Set());
      router.refresh();
      toast.success(
        `Regenerated ${result.regenerated} invoice${result.regenerated !== 1 ? "s" : ""}.${result.errors?.length ? ` ${result.errors.length} skipped.` : ""}`
      );
      if (result.errors?.length) {
        result.errors.forEach((err) => toast.warning(err));
      }
    } else {
      toast.error(result.errors?.[0] ?? "No invoices could be regenerated.");
      result.errors?.slice(1).forEach((err) => toast.warning(err));
    }
  }

  async function handleCancelConfirmed() {
    if (selected.size === 0) return;
    setCancelling(true);
    const ids = Array.from(selected);
    const result = await cancelSelectedInvoices(ids);
    setCancelling(false);
    setShowCancelConfirm(false);
    if (result.ok && result.cancelled != null) {
      setSelected(new Set());
      router.refresh();
      toast.success(`Cancelled ${result.cancelled} invoice${result.cancelled !== 1 ? "s" : ""}`);
    } else {
      toast.error(result.error ?? "Failed to cancel invoices");
    }
  }

  const selectedInvoices = invoices.filter((i) => selected.has(i.id));
  const canRegenerate = selectedInvoices.some((i) => !LOCKED_STATUSES.includes(i.status));
  const canCancel = selectedInvoices.length > 0;
  const canSendReminder = selectedInvoices.some((i) => i.status === "issued");

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || markingPaid || deleting || regenerating || cancelling}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            {sending ? "Sending…" : `Send ${selected.size} selected`}
          </button>
          <button
            type="button"
            onClick={handleMarkAsPaid}
            disabled={sending || markingPaid || deleting || regenerating || cancelling || sendingReminder}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {markingPaid ? "Updating…" : "Mark as paid"}
          </button>
          <button
            type="button"
            onClick={handleSendReminder}
            disabled={sending || markingPaid || deleting || regenerating || cancelling || sendingReminder || !canSendReminder}
            title={!canSendReminder ? "Select issued invoices to send reminders" : "Send reminders to issued invoices' parent(s)"}
            className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/60"
          >
            {sendingReminder ? "Sending…" : "Send payment reminder"}
          </button>
          <button
            type="button"
            onClick={() => setShowRegenerateConfirm(true)}
            disabled={sending || markingPaid || deleting || regenerating || cancelling || sendingReminder || !canRegenerate}
            title={!canRegenerate ? "Select draft invoices to regenerate" : "Recalculate subtotal from current sessions"}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {regenerating ? "Regenerating…" : "Regenerate selected"}
          </button>
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            disabled={sending || markingPaid || deleting || regenerating || cancelling || !canCancel}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
          >
            {cancelling ? "Cancelling…" : "Cancel invoice(s)"}
          </button>
          <button
            type="button"
            onClick={openDeleteConfirm}
            disabled={sending || markingPaid || deleting || regenerating || cancelling}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Delete selected
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            disabled={sending || markingPaid || deleting || regenerating || cancelling}
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Clear selection
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden
            onClick={closeDeleteConfirm}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-invoices-title"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <h2
              id="delete-invoices-title"
              className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Delete invoices?
            </h2>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to delete {selected.size} selected invoice
              {selected.size !== 1 ? "s" : ""}? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={deleting}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </>
      )}

      {showRegenerateConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden
            onClick={() => !regenerating && setShowRegenerateConfirm(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="regenerate-invoices-title"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <h2
              id="regenerate-invoices-title"
              className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Regenerate invoices?
            </h2>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              Subtotal will be recalculated from current sessions for the billing month. Issued or paid
              invoices will be skipped.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !regenerating && setShowRegenerateConfirm(false)}
                disabled={regenerating}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegenerateConfirmed}
                disabled={regenerating}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {regenerating ? "Regenerating…" : "Regenerate"}
              </button>
            </div>
          </div>
        </>
      )}

      {showCancelConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden
            onClick={() => !cancelling && setShowCancelConfirm(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-invoices-title"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          >
            <h2
              id="cancel-invoices-title"
              className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Cancel invoices?
            </h2>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              Cancelled invoices can be replaced with new ones. You can then generate a new invoice
              for the same month.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !cancelling && setShowCancelConfirm(false)}
                disabled={cancelling}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCancelConfirmed}
                disabled={cancelling}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-700"
              >
                {cancelling ? "Cancelling…" : "Cancel invoice(s)"}
              </button>
            </div>
          </div>
        </>
      )}

      {discountInvoice && (
        <EditDiscountModal
          invoice={discountInvoice}
          onClose={() => setDiscountInvoice(null)}
          onSaved={() => {
            setDiscountInvoice(null);
            router.refresh();
          }}
          updateDiscount={updateInvoiceDiscountAction}
        />
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
                  Discount
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
                            : invoice.status === "issued"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                              : invoice.status === "cancelled"
                                ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {formatStatus(invoice.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-zinc-600 dark:text-zinc-400">
                    {formatDiscountDisplay(invoice)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.status === "draft" && (
                        <button
                          type="button"
                          onClick={() => setDiscountInvoice(invoice)}
                          className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                          title={
                            discountHasValue(invoice)
                              ? "Edit discount for this invoice"
                              : "Add a discount to this invoice"
                          }
                        >
                          {discountHasValue(invoice) ? "Edit discount" : "Add discount"}
                        </button>
                      )}
                      <InvoiceDownloadButton
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.invoice_number}
                      />
                    </div>
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
