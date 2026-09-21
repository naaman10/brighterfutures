"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  bftLearnProgressStatusLabel,
  type BftLearnContentFilters,
  type BftLearnContentItem,
  type BftLearnEnrollment,
} from "@/lib/bft-learn";

const emptyFilters = {
  type: [] as string[],
  subject: [] as string[],
  ageGroup: [] as string[],
};

const TO_ASSESS_STATUSES = new Set(["to_assess"]);
const COMPLETED_STATUSES = new Set(["completed", "assessed"]);

function buildContentUrl(studentId: string, filters: BftLearnContentFilters): string {
  const params = new URLSearchParams();
  params.set("studentId", studentId);
  if (filters.type?.trim()) params.set("type", filters.type.trim());
  if (filters.subject?.trim()) params.set("subject", filters.subject.trim());
  if (filters.ageGroup?.trim()) params.set("ageGroup", filters.ageGroup.trim());
  return `/api/bft-learn/content?${params.toString()}`;
}

function displayValue(value: string): string {
  return value.trim() || "—";
}

type Props = { studentId: string };

export function BftLearnContentSection({ studentId }: Props) {
  const [selectedFilters, setSelectedFilters] = useState<BftLearnContentFilters>({});
  const [filterOptions, setFilterOptions] = useState(emptyFilters);
  const [items, setItems] = useState<BftLearnContentItem[]>([]);
  const [enrollments, setEnrollments] = useState<BftLearnEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [assigningEntryId, setAssigningEntryId] = useState<string | null>(null);
  const enrollmentsLoadedRef = useRef(false);

  const loadContent = useCallback(
    async (
      filters: BftLearnContentFilters,
      signal: AbortSignal,
      options: { refreshEnrollments?: boolean } = {}
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(buildContentUrl(studentId, filters), { signal });
        const body = (await response.json()) as {
          filters?: { type?: string[]; subject?: string[]; ageGroup?: string[] };
          items?: BftLearnContentItem[];
          enrollments?: BftLearnEnrollment[];
          error?: string;
          url?: string;
          baseUrl?: string;
        };

        if (!response.ok) {
          const details = [body.error ?? `Failed to load content (${response.status}).`];
          if (body.url) details.push(`Requested: ${body.url}`);
          if (body.baseUrl) details.push(`BFT_API_BASE_URL: ${body.baseUrl}`);
          setError(details.join(" "));
          return;
        }

        setFilterOptions({
          type: body.filters?.type ?? [],
          subject: body.filters?.subject ?? [],
          ageGroup: body.filters?.ageGroup ?? [],
        });
        setItems(body.items ?? []);
        const shouldRefreshEnrollments =
          options.refreshEnrollments || !enrollmentsLoadedRef.current;
        if (shouldRefreshEnrollments && Array.isArray(body.enrollments)) {
          setEnrollments(body.enrollments);
          enrollmentsLoadedRef.current = true;
        }
      } catch (e) {
        if (signal.aborted) return;
        setError(e instanceof Error ? e.message : "Failed to load content.");
      } finally {
        if (!signal.aborted) {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    },
    [studentId]
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadContent(selectedFilters, controller.signal);
    return () => controller.abort();
  }, [loadContent, selectedFilters]);

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

      const assignedItem = items.find((item) => item.entryId === entryId);
      setEnrollments((prev) => {
        if (prev.some((enrollment) => enrollment.entryId === entryId)) return prev;
        return [
          {
            entryId,
            name: assignedItem?.name || contentName,
            type: assignedItem?.type ?? "",
            subject: assignedItem?.subject ?? "",
            ageGroup: assignedItem?.ageGroup ?? "",
            status: "enrolled",
            progressStatus: "not_started",
          },
          ...prev,
        ];
      });
      toast.success(`Assigned "${contentName}".`);
      await loadContent(selectedFilters, new AbortController().signal, {
        refreshEnrollments: true,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to assign content.");
    } finally {
      setAssigningEntryId(null);
    }
  }

  const enrolledEntryIds = useMemo(
    () => new Set(enrollments.map((enrollment) => enrollment.entryId)),
    [enrollments]
  );
  const assignableItems = useMemo(
    () => items.filter((item) => !enrolledEntryIds.has(item.entryId)),
    [items, enrolledEntryIds]
  );

  const initialLoading = loading && !hasLoaded;
  const showEnrollments = initialLoading || enrollments.length > 0 || !error;

  return (
    <div className="mt-8 space-y-8 border-t border-zinc-200 pt-6 dark:border-zinc-700">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {showEnrollments ? (
        <section>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Enrollments
          </h3>

          {initialLoading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading enrollments…</p>
          ) : enrollments.length === 0 ? (
            <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
              No enrollments.
            </p>
          ) : (
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
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.entryId}>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                        {displayValue(enrollment.name)}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {displayValue(enrollment.subject)}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {displayValue(enrollment.ageGroup)}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {displayValue(enrollment.type)}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {bftLearnProgressStatusLabel(enrollment.progressStatus)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <EnrollmentAction studentId={studentId} enrollment={enrollment} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <section>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Assign
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

        {initialLoading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading content…</p>
        ) : !error && assignableItems.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
            {items.length > 0
              ? "All matching content is already assigned."
              : "No content matches the selected filters."}
          </p>
        ) : assignableItems.length > 0 ? (
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
                {assignableItems.map((item) => (
                  <tr key={item.entryId}>
                    <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                      {displayValue(item.name)}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {displayValue(item.subject)}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {displayValue(item.ageGroup)}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {displayValue(item.type)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleAssign(item.entryId, item.name || item.entryId)}
                        disabled={assigningEntryId === item.entryId}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        {assigningEntryId === item.entryId ? "Assigning…" : "Assign"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {loading && hasLoaded && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Updating…</p>
        )}
      </section>
    </div>
  );
}

function EnrollmentAction({
  studentId,
  enrollment,
}: {
  studentId: string;
  enrollment: BftLearnEnrollment;
}) {
  if (TO_ASSESS_STATUSES.has(enrollment.progressStatus)) {
    return (
      <Link
        href={`/dashboard/students/${studentId}/bft-learn/${encodeURIComponent(enrollment.entryId)}/assess`}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        Assess
      </Link>
    );
  }

  if (COMPLETED_STATUSES.has(enrollment.progressStatus)) {
    return (
      <Link
        href={`/dashboard/students/${studentId}/bft-learn/${encodeURIComponent(enrollment.entryId)}`}
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        View
      </Link>
    );
  }

  return <span className="text-sm text-zinc-400 dark:text-zinc-500">—</span>;
}
