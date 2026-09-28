import type { SessionStatus } from "@/lib/session-status";

/** Statuses that can still be the student's next session to attend or complete. */
const UPCOMING_STATUSES = new Set<SessionStatus>([
  "planned",
  "in_progress",
  "planned_reschedule",
]);

export type NextSessionCandidate = {
  session_date: string;
  session_time: string;
  status: SessionStatus | string | null;
};

/** Calendar date in Europe/London as YYYY-MM-DD. */
export function londonCalendarDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function sessionSortKey(session: NextSessionCandidate): string {
  const date = session.session_date.slice(0, 10);
  const [hours = "0", minutes = "0", seconds = "0"] = session.session_time
    .trim()
    .split(":");
  return `${date}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
}

/**
 * Earliest planned, in-progress, or planned-reschedule session on or after
 * today (Europe/London). Sessions earlier today stay eligible so they can
 * still be completed after they have started.
 */
export function pickNextSession<T extends NextSessionCandidate>(
  sessions: T[],
  today = londonCalendarDate()
): T | null {
  const upcoming = sessions.filter((session) => {
    if (!session.status || !UPCOMING_STATUSES.has(session.status as SessionStatus)) {
      return false;
    }
    return session.session_date.slice(0, 10) >= today;
  });
  upcoming.sort((a, b) => sessionSortKey(a).localeCompare(sessionSortKey(b)));
  return upcoming[0] ?? null;
}
