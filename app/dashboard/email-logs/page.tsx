import { formatDisplayDateTime } from "@/lib/format";
import { getEmailLogs } from "@/lib/email-logs";

export const dynamic = "force-dynamic";

type SearchParams =
  | Promise<{ limit?: string; query?: string }>
  | { limit?: string; query?: string };

function parseSearchParams(searchParams: SearchParams): { limit?: number; query?: string } {
  const params = searchParams instanceof Promise ? undefined : searchParams;
  if (!params) return {};
  const limitRaw = params.limit ? Number(params.limit) : undefined;
  const limit = limitRaw && !Number.isNaN(limitRaw) ? limitRaw : undefined;
  const query = params.query?.trim() || undefined;
  return { limit, query };
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === "delivered" || s === "processed") {
    return "bg-mint text-emerald-800 dark:text-emerald-200";
  }
  if (s === "bounce" || s === "bounced" || s === "dropped" || s === "blocked") {
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  }
  if (s === "deferred") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  }
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
}

export default async function EmailLogsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { limit = 50, query } = parseSearchParams(searchParams);

  const result = await getEmailLogs({ limit, query });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Email logs
        </h1>
      </div>

      <form
        className="mb-4 flex flex-wrap items-end gap-3 surface text-sm"
        method="GET"
      >
        <div>
          <label
            htmlFor="limit"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            Limit
          </label>
          <select
            id="limit"
            name="limit"
            defaultValue={String(limit)}
            className="w-28 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        <div className="min-w-[180px] flex-1">
          <label
            htmlFor="query"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            Search by recipient
          </label>
          <input
            id="query"
            name="query"
            defaultValue={query ?? ""}
            placeholder="e.g. parent@example.com"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <button
          type="submit"
          className="btn-primary"
        >
          Apply
        </button>
      </form>

      {!result.ok ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <p>{result.error}</p>
          <p className="mt-2">
            Email logs are unavailable. Check that{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">
              RESEND_API_KEY
            </code>{" "}
            is set in your environment variables.
          </p>
        </div>
      ) : result.logs.length === 0 ? (
        <p className="surface p-6 text-sm text-zinc-500 dark:text-zinc-400">
          No email logs yet.
        </p>
      ) : (
        <div className="overflow-hidden surface p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Sent at
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    To
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Subject / Template
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {result.logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                      {formatDisplayDateTime(log.timestamp) || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                      {log.to || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {log.subject || log.templateId || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(log.status)}`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

