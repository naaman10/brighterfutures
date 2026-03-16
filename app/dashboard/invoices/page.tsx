import { getInvoices, getParents } from "@/lib/db";
import { GenerateInvoicesButton } from "./generate-invoices-button";
import { GenerateSingleInvoiceModal } from "./generate-single-invoice-modal";
import { InvoicesTable } from "./invoices-table";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  let invoices: Awaited<ReturnType<typeof getInvoices>> = [];
  let parents: Awaited<ReturnType<typeof getParents>> = [];
  let dbError: string | null = null;

  try {
    [invoices, parents] = await Promise.all([getInvoices(), getParents()]);
  } catch (e) {
    dbError =
      e instanceof Error ? e.message : "Failed to load invoices from database.";
  }

  const parentOptions = parents.map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
  }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Invoices
        </h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <GenerateInvoicesButton />
        <GenerateSingleInvoiceModal parents={parentOptions} />
      </div>

      {dbError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {dbError}
          <p className="mt-2">
            If the <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">invoices</code> table
            doesn&apos;t exist, create it in the Neon SQL Editor.
          </p>
        </div>
      )}

      {!dbError && invoices.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-6 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          No invoices yet.
        </p>
      ) : (
        <InvoicesTable invoices={invoices} />
      )}
    </div>
  );
}
