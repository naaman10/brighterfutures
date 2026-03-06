import Link from "next/link";
import { getParents } from "@/lib/db";
import { ParentAccordion } from "../parent-accordion";

export default async function ParentsPage() {
  let parents: Awaited<ReturnType<typeof getParents>> = [];
  let dbError: string | null = null;

  try {
    parents = await getParents();
  } catch (e) {
    dbError =
      e instanceof Error ? e.message : "Failed to load parents from database.";
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Parents
        </h1>
        <Link
          href="/dashboard/parents/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add parent
        </Link>
      </div>

      {dbError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {dbError}
          <p className="mt-2">
            If the <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">parents</code> table
            doesn&apos;t exist, run{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">sql/create-parents.sql</code>{" "}
            in the Neon SQL Editor.
          </p>
        </div>
      )}

      {!dbError && parents.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-6 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          No parents yet. Add a parent or add rows to the{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">parents</code> table in Neon.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          {parents.map((parent, index) => (
            <ParentAccordion key={parent.id} parent={parent} index={index} />
          ))}
        </ul>
      )}
    </div>
  );
}
