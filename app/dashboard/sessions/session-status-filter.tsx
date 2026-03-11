"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SESSION_STATUS_LABELS } from "@/lib/session-status";

const FILTER_STATUSES = [
  "planned",
  "in_progress",
  "completed",
  "rescheduled",
  "planned_reschedule",
] as const;

type Props = { currentStatus: string | null };

export function SessionStatusFilter({ currentStatus }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    if (value === "") {
      next.delete("status");
    } else {
      next.set("status", value);
    }
    const q = next.toString();
    router.push(q ? `/dashboard/sessions?${q}` : "/dashboard/sessions");
  }

  return (
    <select
      value={currentStatus ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      aria-label="Filter by status"
    >
      <option value="">All statuses</option>
      {FILTER_STATUSES.map((status) => (
        <option key={status} value={status}>
          {SESSION_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
