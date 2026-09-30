import { getLeads } from "@/lib/db";
import { LeadsBoard } from "./leads-board";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  let leads: Awaited<ReturnType<typeof getLeads>> = [];
  let dbError: string | null = null;

  try {
    leads = await getLeads();
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Failed to load leads from database.";
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Leads
      </h1>

      {dbError && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {dbError}
        </div>
      )}

      {!dbError && leads.length === 0 ? (
        <p className="surface p-6 text-zinc-500 dark:text-zinc-400">
          No leads yet.
        </p>
      ) : (
        <LeadsBoard initialLeads={leads as Record<string, unknown>[]} />
      )}
    </div>
  );
}

