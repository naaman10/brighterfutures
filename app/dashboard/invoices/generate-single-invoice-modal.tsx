"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
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
    setLoading(false);
    if (result.ok && result.message) {
      setMessage(result.message);
      router.refresh();
      setTimeout(closeModal, 1500);
    } else {
      setError(result.error ?? "Failed to generate invoice.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
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
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {loading ? "Generating…" : "Generate invoice"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
