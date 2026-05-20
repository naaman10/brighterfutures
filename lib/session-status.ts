/**
 * Session status constants and labels. Kept in a separate module so client
 * components can import them without pulling in the database connection.
 */

export const SESSION_STATUSES = [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
  "rescheduled",
  "planned_reschedule",
] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
  planned_reschedule: "Planned reschedule",
};

export function isPlannedReschedule(status: string | null | undefined): boolean {
  return status === "planned_reschedule";
}

/** Original session after reschedule — hidden on dashboard calendars. */
export function isRescheduledOriginal(status: string | null | undefined): boolean {
  return status === "rescheduled";
}

export function isCancelled(status: string | null | undefined): boolean {
  return status === "cancelled";
}

export function isVisibleOnCalendar(status: string | null | undefined): boolean {
  return !isRescheduledOriginal(status) && !isCancelled(status);
}

export function filterSessionsForCalendar<T extends { status?: string | null }>(
  sessions: T[]
): T[] {
  return sessions.filter((s) => isVisibleOnCalendar(s.status));
}

/** Calendar session chip/card classes (month and week views). */
export function getCalendarSessionClasses(
  status: string | null | undefined,
  opts?: { interactive?: boolean }
): string {
  const interactive = opts?.interactive ?? true;
  const hover = interactive
    ? "hover:bg-red-100 dark:hover:bg-red-950/60"
    : "";

  if (isPlannedReschedule(status)) {
    return `border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100 ${hover}`;
  }

  const baseHover = interactive
    ? "hover:bg-zinc-50 dark:hover:bg-zinc-700"
    : "";
  return `border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-800 ${baseHover}`;
}
