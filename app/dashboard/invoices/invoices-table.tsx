"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Invoice } from "@/lib/db";
import { ActionButton, useActionLock } from "@/app/dashboard/components/action-button";
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
  const { pending, activeKey, run } = useActionLock<
    "send" | "reminder" | "paid" | "delete" | "regenerate" | "cancel"
  >();
  const sending = activeKey === "send";
  const sendingReminder = activeKey === "reminder";
  const markingPaid = activeKey === "paid";
  const deleting = activeKey === "delete";
  const regenerating = activeKey === "regenerate";
  const cancelling = activeKey === "cancel";
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [discountInvoice, setDiscountInvoice] = useState<Invoice | null>(null);

  const outstandingInvoices = invoices.filter((inv) => inv.status !== "paid");
  const paidInvoices = invoices.filter((inv) => inv.status === "paid");

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllOutstanding = () => {
    const outstandingIds = new Set(outstandingInvoices.map((i) => i.id));
    const allOutstandingSelected = outstandingInvoices.every((i) => selected.has(i.id));
    
    if (allOutstandingSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        outstandingIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...outstandingIds]));
    }
  };

  const toggleAllPaid = () => {
    const paidIds = new Set(paidInvoices.map((i) => i.id));
    const allPaidSelected = paidInvoices.every((i) => selected.has(i.id));
    
    if (allPaidSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        paidIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...paidIds]));
    }
  };

  async function handleSend() {
    if (selected.size === 0) return;
    await run(async () => {
      const ids = Array.from(selected);
      const result = await sendSelectedInvoices(ids);
      if (result.ok && result.sent != null) {
        setSelected(new Set());
        router.refresh();
        toast.success(`Sent ${result.sent} invoice${result.sent !== 1 ? "s" : ""}`);
      } else {
        toast.error(result.error ?? "Failed to send invoices");
      }
    }, "send");
  }

  async function handleMarkAsPaid() {
    if (selected.size === 0) return;
    await run(async () => {
      const ids = Array.from(selected);
      const result = await markSelectedInvoicesAsPaid(ids);
      if (result.ok && result.updated != null) {
        setSelected(new Set());
        router.refresh();
        toast.success(`Marked ${result.updated} invoice${result.updated !== 1 ? "s" : ""} as paid`);
      } else {
        toast.error(result.error ?? "Failed to mark invoices as paid");
      }
    }, "paid");
  }

  async function handleSendReminder() {
    if (selected.size === 0) return;
    await run(async () => {
      const ids = Array.from(selected);
      const result = await sendPaymentReminders(ids);
      if (result.ok && result.sent != null) {
        setSelected(new Set());
        router.refresh();
        toast.success(
          `Sent ${result.sent} payment reminder${result.sent !== 1 ? "s" : ""}`
        );
      } else {
        toast.error(result.error ?? "Failed to send payment reminders");
      }
    }, "reminder");
  }

  function openDeleteConfirm() {
    setShowDeleteConfirm(true);
  }

  function closeDeleteConfirm() {
    if (!deleting) setShowDeleteConfirm(false);
  }

  async function handleDeleteConfirmed() {
    if (selected.size === 0) return;
    await run(async () => {
      const ids = Array.from(selected);
      const result = await deleteSelectedInvoices(ids);
      setShowDeleteConfirm(false);
      if (result.ok && result.deleted != null) {
        setSelected(new Set());
        router.refresh();
        toast.success(`Deleted ${result.deleted} invoice${result.deleted !== 1 ? "s" : ""}`);
      } else {
        toast.error(result.error ?? "Failed to delete invoices");
      }
    }, "delete");
  }

  async function handleRegenerateConfirmed() {
    if (selected.size === 0) return;
    await run(async () => {
      const ids = Array.from(selected);
      const result = await regenerateSelectedInvoices(ids);
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
    }, "regenerate");
  }

  async function handleCancelConfirmed() {
    if (selected.size === 0) return;
    await run(async () => {
      const ids = Array.from(selected);
      const result = await cancelSelectedInvoices(ids);
      setShowCancelConfirm(false);
      if (result.ok && result.cancelled != null) {
        setSelected(new Set());
        router.refresh();
        toast.success(`Cancelled ${result.cancelled} invoice${result.cancelled !== 1 ? "s" : ""}`);
      } else {
        toast.error(result.error ?? "Failed to cancel invoices");
      }
    }, "cancel");
  }

  const selectedInvoices = invoices.filter((i) => selected.has(i.id));
  const canRegenerate = selectedInvoices.some((i) => !LOCKED_STATUSES.includes(i.status));
  const canCancel = selectedInvoices.length > 0;
  const canSendReminder = selectedInvoices.some((i) => i.status === "issued");

  const renderTable = (
    invoiceList: Invoice[],
    title: string,
    toggleAllFn: () => void
  ) => {
    if (invoiceList.length === 0) {
      return (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          <p className="surface p-6 text-zinc-500 dark:text-zinc-400">
            No {title.toLowerCase()} yet.
          </p>
        </div>
      );
    }

    const allSelected = invoiceList.every((i) => selected.has(i.id));

    return (
      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <div className="overflow-hidden surface p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={invoiceList.length > 0 && allSelected}
                      onChange={toggleAllFn}
                      aria-label={`Select all ${title.toLowerCase()}`}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Invoice
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Parent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Billing month
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Due date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Discount
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Total
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {invoiceList.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selected.has(invoice.id)}
                        onChange={() => toggleOne(invoice.id)}
                        aria-label={`Select invoice ${invoice.invoice_number}`}
                        className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {invoice.parent_name?.trim() || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                      {formatDisplayDate(invoice.billing_month) || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                      {formatDisplayDate(invoice.due_date) || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          invoice.status === "paid"
                            ? "bg-mint text-emerald-800 dark:text-emerald-200"
                            : invoice.status === "overdue"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:bg-amber-300"
                              : invoice.status === "issued"
                                ? "bg-accent-soft text-accent dark:text-pink-200"
                                : invoice.status === "cancelled"
                                  ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {formatStatus(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-zinc-600 dark:text-zinc-400">
                      {formatDiscountDisplay(invoice)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 text-right">
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
  };

  return (
    <div className="space-y-6">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton
            type="button"
            onClick={handleSend}
            pending={sending}
            pendingLabel="Sending…"
            disabled={pending}
            className="btn-primary"
          >
            {`Send ${selected.size} selected`}
          </ActionButton>
          <ActionButton
            type="button"
            onClick={handleMarkAsPaid}
            pending={markingPaid}
            pendingLabel="Updating…"
            disabled={pending}
            className="btn-secondary"
          >
            Mark as paid
          </ActionButton>
          <ActionButton
            type="button"
            onClick={handleSendReminder}
            pending={sendingReminder}
            pendingLabel="Sending…"
            disabled={pending || !canSendReminder}
            title={!canSendReminder ? "Select issued invoices to send reminders" : "Send reminders to issued invoices' parent(s)"}
            className="btn-secondary"
          >
            Send payment reminder
          </ActionButton>
          <ActionButton
            type="button"
            onClick={() => setShowRegenerateConfirm(true)}
            pending={regenerating}
            pendingLabel="Regenerating…"
            disabled={pending || !canRegenerate}
            title={!canRegenerate ? "Select draft invoices to regenerate" : "Recalculate subtotal from current sessions"}
            className="btn-secondary"
          >
            Regenerate selected
          </ActionButton>
          <ActionButton
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            pending={cancelling}
            pendingLabel="Cancelling…"
            disabled={pending || !canCancel}
            className="btn-secondary"
          >
            Cancel invoice(s)
          </ActionButton>
          <button
            type="button"
            onClick={openDeleteConfirm}
            disabled={pending}
            className="btn-danger-outline"
          >
            Delete selected
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            disabled={pending}
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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 surface p-6 shadow-xl"
          >
            <h2
              id="delete-invoices-title"
              className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Delete invoices?
            </h2>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to delete {selected.size} selected invoice
              {selected.size !== 1 ? "s" : ""}? The invoice{selected.size !== 1 ? "s" : ""} will be marked as deleted and hidden from view.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={deleting}
                className="btn-secondary"
              >
                Cancel
              </button>
              <ActionButton
                type="button"
                onClick={handleDeleteConfirmed}
                pending={deleting}
                pendingLabel="Deleting…"
                className="btn-danger"
              >
                Delete
              </ActionButton>
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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 surface p-6 shadow-xl"
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
                className="btn-secondary"
              >
                Cancel
              </button>
              <ActionButton
                type="button"
                onClick={handleRegenerateConfirmed}
                pending={regenerating}
                pendingLabel="Regenerating…"
                className="btn-primary"
              >
                Regenerate
              </ActionButton>
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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 surface p-6 shadow-xl"
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
                className="btn-secondary"
              >
                Back
              </button>
              <ActionButton
                type="button"
                onClick={handleCancelConfirmed}
                pending={cancelling}
                pendingLabel="Cancelling…"
                className="btn-warning"
              >
                Cancel invoice(s)
              </ActionButton>
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

      {renderTable(outstandingInvoices, "Outstanding Invoices", toggleAllOutstanding)}
      {renderTable(paidInvoices, "Paid Invoices", toggleAllPaid)}
    </div>
  );
}
