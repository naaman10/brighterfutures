/** Shared calendar helpers for dashboard month/week views. */

export const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type CalendarView = "month" | "week";

export function toDateKey(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const d = value instanceof Date ? value : new Date(String(value));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayDateStr(): string {
  const d = new Date();
  return toDateKey(d);
}

export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function parseMonthParam(param: string | undefined): { year: number; month: number } | null {
  if (!param || !/^\d{4}-\d{2}$/.test(param)) return null;
  const [y, m] = param.split("-").map(Number);
  if (m < 1 || m > 12) return null;
  return { year: y, month: m };
}

export function parseWeekParam(param: string | undefined): string | null {
  if (!param || !/^\d{4}-\d{2}-\d{2}$/.test(param)) return null;
  return param;
}

export function parseViewParam(param: string | undefined): CalendarView | null {
  if (param === "month" || param === "week") return param;
  return null;
}

/** Monday-based week containing `anchorDate` (YYYY-MM-DD). */
export function getWeekRange(anchorDate: string): {
  start: string;
  end: string;
  dates: string[];
  monday: Date;
} {
  const anchor = new Date(`${anchorDate}T12:00:00`);
  const day = anchor.getDay();
  const monOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + monOffset);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(toDateKey(d));
  }

  return { start: dates[0]!, end: dates[6]!, dates, monday };
}

export function addDaysToDateKey(dateKeyStr: string, days: number): string {
  const d = new Date(`${dateKeyStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function formatWeekLabel(dates: string[]): string {
  const start = new Date(`${dates[0]}T12:00:00`);
  const end = new Date(`${dates[6]}T12:00:00`);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = MONTH_NAMES[start.getMonth()];
  const endMonth = MONTH_NAMES[end.getMonth()];
  const year = end.getFullYear();

  if (start.getMonth() === end.getMonth()) {
    return `${startDay}–${endDay} ${startMonth} ${year}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
}

export function buildDashboardCalendarUrl(opts: {
  view?: CalendarView | null;
  month?: string;
  week?: string;
}): string {
  const params = new URLSearchParams();
  if (opts.view) params.set("view", opts.view);
  if (opts.month) params.set("month", opts.month);
  if (opts.week) params.set("week", opts.week);
  const q = params.toString();
  return q ? `/dashboard?${q}` : "/dashboard";
}

/** Parse HH:mm (or DB time string) to minutes from midnight. */
export function parseTimeToMinutes(time: string): number | null {
  const s = String(time).trim();
  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
  }
  const d = new Date(s.includes("T") ? s : `1970-01-01T${s}`);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
}

/** Default visible window in week view (scrollable area shows this height initially). */
export const WEEK_VISIBLE_START_HOUR = 8;
export const WEEK_VISIBLE_END_HOUR = 17;

/** Full scrollable grid bounds before extending for out-of-range sessions. */
export const WEEK_GRID_START_HOUR = 6;
export const WEEK_GRID_END_HOUR = 22;

export const HOUR_HEIGHT_PX = 44;
export const SESSION_BLOCK_MINUTES = 60;

export function getWeekGridHourRange(
  sessions: { session_time: string }[]
): { startHour: number; endHour: number } {
  let minMinutes = WEEK_GRID_START_HOUR * 60;
  let maxMinutes = WEEK_GRID_END_HOUR * 60;

  for (const s of sessions) {
    const mins = parseTimeToMinutes(s.session_time);
    if (mins == null) continue;
    minMinutes = Math.min(minMinutes, mins);
    maxMinutes = Math.max(maxMinutes, mins + SESSION_BLOCK_MINUTES);
  }

  const startHour = Math.max(0, Math.floor(minMinutes / 60));
  const endHour = Math.min(24, Math.ceil(maxMinutes / 60));
  return { startHour, endHour: Math.max(startHour + 1, endHour) };
}

export function getWeekInitialScrollTopPx(startHour: number): number {
  return Math.max(0, (WEEK_VISIBLE_START_HOUR - startHour) * HOUR_HEIGHT_PX);
}

export const DRAG_SNAP_MINUTES = 15;

export function snapMinutesToInterval(
  minutes: number,
  interval = DRAG_SNAP_MINUTES
): number {
  return Math.round(minutes / interval) * interval;
}

export function snapMinutesUp(
  minutes: number,
  interval = DRAG_SNAP_MINUTES
): number {
  return Math.ceil(minutes / interval) * interval;
}

export function minutesToTimeString(minutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Earliest schedulable minute-of-day for a date (0 if future day; now if today). */
export function getEarliestMinutesForDate(dateStr: string): number {
  const today = toDateKey(new Date());
  if (dateStr > today) return 0;
  if (dateStr < today) return 24 * 60;
  const now = new Date();
  return snapMinutesUp(now.getHours() * 60 + now.getMinutes());
}

export function clampScheduleMinutes(
  dateStr: string,
  minutes: number,
  gridEndHour: number
): number | null {
  const earliest = getEarliestMinutesForDate(dateStr);
  if (earliest >= 24 * 60) return null;
  const max = gridEndHour * 60 - DRAG_SNAP_MINUTES;
  const snapped = snapMinutesToInterval(minutes);
  return Math.max(earliest, Math.min(max, snapped));
}

export function canDragSession(status: string | null | undefined): boolean {
  return status !== "rescheduled" && status !== "cancelled";
}

/** Drag updates date/time in place (no new session). */
export function isCalendarDragMoveOnly(status: string | null | undefined): boolean {
  return status === "planned_reschedule";
}
