"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { BftLearnContentFilters, BftLearnContentResponse } from "@/lib/bft-learn";

const emptyFilters = {
  type: [] as string[],
  subject: [] as string[],
  ageGroup: [] as string[],
};

function buildContentUrl(filters: BftLearnContentFilters): string {
  const params = new URLSearchParams();
  if (filters.type?.trim()) params.set("type", filters.type.trim());
  if (filters.subject?.trim()) params.set("subject", filters.subject.trim());
  if (filters.ageGroup?.trim()) params.set("ageGroup", filters.ageGroup.trim());
  const query = params.toString();
  return `/api/bft-learn/content${query ? `?${query}` : ""}`;
}

type Props = { studentId: string };

export function BftLearnContentSection({ studentId }: Props) {
  const [selectedFilters, setSelectedFilters] = useState<BftLearnContentFilters>({});
  const [content, setContent] = useState<BftLearnContentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningEntryId, setAssigningEntryId] = useState<string | null>(null);
  const [assignedEntryIds, setAssignedEntryIds] = useState<Set<string>>(new Set());

  const loadContent = useCallback(async (filters: BftLearnContentFilters, signal: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildContentUrl(filters), { signal });
      const body = (await response.json()) as BftLearnContentResponse & {
        error?: string;
        url?: string;
        baseUrl?: string;
      };

      if (!response.ok) {
        setContent(null);
        const details = [body.error ?? `Failed to load content (${response.status}).`];
        if (body.url) details.push(`Requested: ${body.url}`);
        if (body.baseUrl) details.push(`BFT_API_BASE_URL: ${body.baseUrl}`);
        setError(details.join(" "));
        return;
      }

      setContent({
        filters: {
          type: body.filters?.type ?? [],
          subject: body.filters?.subject ?? [],
          ageGroup: body.filters?.ageGroup ?? [],
        },
        items: body.items ?? [],
      });
    } catch (e) {
      if (signal.aborted) return;
      setContent(null);
      setError(e instanceof Error ? e.message : "Failed to load content.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadContent(selectedFilters, controller.signal);
    return () => controller.abort();
  }, [loadContent, selectedFilters.type, selectedFilters.subject, selectedFilters.ageGroup]);

  function updateFilter(key: keyof BftLearnContentFilters, value: string) {
    setSelectedFilters((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  }

  async function handleAssign(entryId: string, contentName: string) {
    if (assigningEntryId) return;
    setAssigningEntryId(entryId);

    try {
      const response = await fetch(`/api/bft-learn/enroll/${encodeURIComponent(studentId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentIds: [entryId] }),
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(body.error ?? "Failed to assign content.");
        return;
      }

      setAssignedEntryIds((prev) => new Set(prev).add(entryId));
      toast.success(`Assigned "${contentName}".`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to assign content.");
    } finally {
      setAssigningEntryId(null);
    }
  }

  const filterOptions = content?.filters ?? emptyFilters;

  return (
    <section className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-700">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Available content
      </h3>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="bft-content-subject"
            className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Subject
          </label>
          <select
            id="bft-content-subject"
            value={selectedFilters.subject ?? ""}
            onChange={(e) => updateFilter("subject", e.target.value)}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">All subjects</option>
            {filterOptions.subject.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="bft-content-age-group"
            className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Age group
          </label>
          <select
            id="bft-content-age-group"
            value={selectedFilters.ageGroup ?? ""}
            onChange={(e) => updateFilter("ageGroup", e.target.value)}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">All age groups</option>
            {filterOptions.ageGroup.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="bft-content-type"
            className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
          >
            Type
          </label>
          <select
            id="bft-content-type"
            value={selectedFilters.type ?? ""}
            onChange={(e) => updateFilter("type", e.target.value)}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">All types</option>
            {filterOptions.type.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && !content && (
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">Loading content…</p>
      )}

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {!loading && content && content.items.length === 0 && !error ? (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
          No content matches the selected filters.
        </p>
      ) : null}

      {content && content.items.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Age group
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
              {content.items.map((item) => (
                <tr key={item.entryId}>
                  <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {item.subject}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {item.ageGroup}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {item.type}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {assignedEntryIds.has(item.entryId) ? (
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Assigned
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleAssign(item.entryId, item.name)}
                        disabled={assigningEntryId === item.entryId}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        {assigningEntryId === item.entryId ? "Assigning…" : "Assign"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {loading && content && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Updating…</p>
      )}
    </section>
  );
}
