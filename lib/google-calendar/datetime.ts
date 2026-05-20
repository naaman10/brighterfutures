import { getGoogleCalendarTimezone } from "./config";

/** Session date from DB — always YYYY-MM-DD (strip any accidental ISO suffix). */
export function normalizeSessionDate(session_date: string): string {
  const match = session_date.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1]! : session_date.slice(0, 10);
}

export function normalizeSessionTime(session_time: string): string {
  const trimmed = session_time.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  return trimmed;
}

/**
 * RFC3339 local date-time without offset — pair with Google Calendar `timeZone`.
 * Example: 2026-05-20T15:00:00 + Europe/London => 3pm UK wall clock.
 */
export function sessionToGoogleDateTime(
  session_date: string,
  session_time: string
): { dateTime: string; timeZone: string } {
  const date = normalizeSessionDate(session_date);
  const time = normalizeSessionTime(session_time);
  return {
    dateTime: `${date}T${time}`,
    timeZone: getGoogleCalendarTimezone(),
  };
}

/** Add minutes to a wall-clock start (same timezone; handles day rollover). */
export function addMinutesToGoogleDateTime(
  startDateTime: string,
  minutesToAdd: number
): string {
  const [datePart, timePart] = startDateTime.split("T");
  if (!datePart || !timePart) return startDateTime;

  const [year, month, day] = datePart.split("-").map(Number);
  const timeBits = timePart.split(":").map(Number);
  const hours = timeBits[0] ?? 0;
  const minutes = timeBits[1] ?? 0;
  const seconds = timeBits[2] ?? 0;

  let totalMinutes = hours * 60 + minutes + minutesToAdd;
  let dayDelta = 0;
  while (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    dayDelta += 1;
  }
  while (totalMinutes < 0) {
    totalMinutes += 24 * 60;
    dayDelta -= 1;
  }

  const endDate = new Date(year, month - 1, day + dayDelta);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}:${pad(seconds)}`;
}

/** Parse a Google event start into app session_date + session_time in the event timezone. */
export function googleEventToSessionDateTime(
  dateTime: string,
  timeZone?: string | null
): { date: string; time: string } | null {
  const instant = new Date(dateTime);
  if (Number.isNaN(instant.getTime())) return null;

  const tz = timeZone?.trim() || getGoogleCalendarTimezone();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(instant);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const day = get("day");
  const month = get("month");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");

  if (!year || !month || !day) return null;

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`,
  };
}
