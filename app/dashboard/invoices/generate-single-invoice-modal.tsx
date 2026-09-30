"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton, useActionLock } from "@/app/dashboard/components/action-button";
import { generateInvoiceForParentAndMonth } from "./actions";

type ParentOption = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

type Props = {
  parents: ParentOption[];
};

function parentLabel(p: ParentOption): string {
  const first = (p.first_name ?? "").trim();
  const last = (p.last_name ?? "").trim();
  return [first, last].filter(Boolean).join(" ") || "Unknown";
}

export function GenerateSingleInvoiceModal({ parents }: Props) {
  const [open, setOpen] = useState(false);
  const [parentId, setParentId] = useState("");
  const [month, setMonth] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const { pending: loading, run } = useActionLock();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  function closeModal() {
    if (!loading) {
      setOpen(false);
      setError(null);
      setMessage(null);
      setParentId("");
      setMonth("");
      setDiscountAmount("");
      setDiscountPct("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!parentId || !month) return;
    await run(async () => {
      setError(null);
      setMessage(null);
      const billingMonth = `${month}-01`;
      const options =
        discountAmount !== "" || discountPct !== ""
          ? {
              discount_amount: discountAmount !== "" ? Number(discountAmount) : undefined,
              discount_pct: discountPct !== "" ? Number(discountPct) : undefined,
            }
          : undefined;
      const result = await generateInvoiceForParentAndMonth(parentId, billingMonth, options);
      if (result.ok && result.message) {
        setMessage(result.message);
        router.refresh();
        setTimeout(closeModal, 1500);
      } else {
        setError(result.error ?? "Failed to generate invoice.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary"
      >
        Generate for parent & month
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="generate-single-invoice-title"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 surface p-6 shadow-xl"
          >
            <h2
              id="generate-single-invoice-title"
              className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Generate invoice for parent & month
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="single-invoice-parent"
                  className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Parent
                </label>
                <select
                  id="single-invoice-parent"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="">Select a parent</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {parentLabel(p)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="single-invoice-month"
                  className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Billing month
                </label>
                <input
                  id="single-invoice-month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="single-invoice-discount-amount"
                    className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Discount amount (£)
                  </label>
                  <input
                    id="single-invoice-discount-amount"
                    type="number"
                    min={0}
                    step={0.01}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="single-invoice-discount-pct"
                    className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Discount (%)
                  </label>
                  <input
                    id="single-invoice-discount-pct"
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {error}
                </p>
              )}
              {message && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {message}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <ActionButton
                  type="submit"
                  pending={loading}
                  pendingLabel="Generating…"
                  className="btn-primary"
                >
                  Generate invoice
                </ActionButton>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
