/**
 * Session status constants and labels. Kept in a separate module so client
 * components can import them without pulling in the database connection.
 */

export const SESSION_STATUSES = [
  "planned",
  "in_progress",
  "completed",
  "rescheduled",
  "planned_reschedule",
] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
  rescheduled: "Rescheduled",
  planned_reschedule: "Planned reschedule",
};
