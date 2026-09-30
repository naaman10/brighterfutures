"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Invoice } from "@/lib/db";

function hasDiscount(invoice: Invoice): boolean {
  const amount = Number(invoice.discount_amount);
  const pct = Number(invoice.discount_pct);
  return (!Number.isNaN(amount) && amount > 0) || (!Number.isNaN(pct) && pct > 0);
}

type Props = {
  invoice: Invoice;
  onClose: () => void;
  onSaved: () => void;
  updateDiscount: (
    invoiceId: number,
    discount_amount: number | null,
    discount_pct: number | null
  ) => Promise<{ ok?: boolean; error?: string }>;
};

export function EditDiscountModal({ invoice, onClose, onSaved, updateDiscount }: Props) {
  const [amount, setAmount] = useState(() => {
    const n = Number(invoice.discount_amount);
    return Number.isNaN(n) ? "" : String(n);
  });
  const [pct, setPct] = useState(() => {
    const n = Number(invoice.discount_pct);
    return Number.isNaN(n) ? "" : String(n);
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = amount === "" ? 0 : Number(amount);
    const pctNum = pct === "" ? 0 : Number(pct);
    if (Number.isNaN(amountNum) || amountNum < 0 || Number.isNaN(pctNum) || pctNum < 0 || pctNum > 100) {
      toast.error("Enter valid discount amount (≥ 0) and percentage (0–100).");
      return;
    }
    setSaving(true);
    const result = await updateDiscount(invoice.id, amountNum, pctNum);
    setSaving(false);
    if (result.ok) {
      toast.success("Discount updated.");
      onSaved();
    } else {
      toast.error(result.error ?? "Failed to update discount.");
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-discount-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 surface p-6 shadow-xl"
      >
        <h2 id="edit-discount-title" className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {hasDiscount(invoice) ? "Edit discount" : "Add discount"}
        </h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Invoice {invoice.invoice_number}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="discount-amount" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Discount amount (£)
            </label>
            <input
              id="discount-amount"
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="discount-pct" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Discount (%)
            </label>
            <input
              id="discount-pct"
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={pct}
              onChange={(e) => setPct(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
