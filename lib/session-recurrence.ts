/**
 * Recurrence rules and the pure planning used to create, edit, and backfill series.
 * No database access, so the backfill script and the app can share it.
 */

export const RECURRENCE_INTERVALS = [
  "weekly",
  "biweekly",
  "every_3_weeks",
  "monthly",
] as const;

export type RecurrenceInterval = (typeof RECURRENCE_INTERVALS)[number];

export const RECURRENCE_INTERVAL_LABELS: Record<RecurrenceInterval, string> = {
  weekly: "Every week",
  biweekly: "Every two weeks",
  every_3_weeks: "Every three weeks",
  monthly: "Monthly",
};

const FORM_INTERVAL_TO_RECURRENCE: Record<string, RecurrenceInterval> = {
  "1": "weekly",
  "2": "biweekly",
  "3": "every_3_weeks",
  monthly: "monthly",
};

const INTERVAL_STEP_DAYS: Record<Exclude<RecurrenceInterval, "monthly">, number> = {
  weekly: 7,
  biweekly: 14,
  every_3_weeks: 21,
};

export type SessionRecurrence = {
  id: string;
  student_id: string;
  subject: string;
  interval: RecurrenceInterval;
  day_of_week: number;
  month_weekday_occurrence: number | null;
  session_time: string;
  start_date: string;
  end_date: string;
};

export function isRecurrenceInterval(value: string): value is RecurrenceInterval {
  return (RECURRENCE_INTERVALS as readonly string[]).includes(value);
}

export function formIntervalToRecurrence(interval: string): RecurrenceInterval {
  return FORM_INTERVAL_TO_RECURRENCE[interval] ?? "weekly";
}

export function weekdayOfYmd(ymd: string): number {
  const [year, month, day] = ymd.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1)).getUTCDay();
}

export function daysBetweenYmd(earlier: string, later: string): number {
  const toUtc = (ymd: string) => {
    const [year, month, day] = ymd.slice(0, 10).split("-").map(Number);
    return Date.UTC(year, (month ?? 1) - 1, day ?? 1);
  };
  return Math.round((toUtc(later) - toUtc(earlier)) / 86_400_000);
}

export function normalizeSessionTime(value: string): string {
  const [hours = "0", minutes = "0"] = value.trim().split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

function parseUtcDate(ymd: string): Date {
  const [year, month, day] = ymd.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

function toYmd(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function firstWeekdayOnOrAfter(start: Date, dayOfWeek: number): Date {
  const cur = new Date(start.getTime());
  while (cur.getUTCDay() !== dayOfWeek) {
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return cur;
}

/** 1-based occurrence of this weekday in its month (5 = fifth). */
export function weekdayOccurrenceInMonth(date: Date): number {
  const dayOfWeek = date.getUTCDay();
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  let count = 0;
  for (let day = 1; day <= date.getUTCDate(); day++) {
    if (new Date(Date.UTC(year, month, day)).getUTCDay() === dayOfWeek) count++;
  }
  return count;
}

/** Nth weekday in a month. If the month has fewer, returns the last one. */
function nthWeekdayOfMonth(
  year: number,
  monthIndex: number,
  dayOfWeek: number,
  n: number
): Date {
  let count = 0;
  let last: Date | null = null;
  for (let day = 1; day <= 31; day++) {
    const date = new Date(Date.UTC(year, monthIndex, day));
    if (date.getUTCMonth() !== monthIndex) break;
    if (date.getUTCDay() === dayOfWeek) {
      count++;
      last = date;
      if (count === n) return date;
    }
  }
  return last ?? new Date(Date.UTC(year, monthIndex, 1));
}

export function recurrenceDates(input: {
  startDate: string;
  endDate: string;
  dayOfWeek: number;
  interval: RecurrenceInterval;
  monthWeekdayOccurrence?: number | null;
}): string[] {
  const start = parseUtcDate(input.startDate);
  const end = parseUtcDate(input.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return [];
  }

  if (input.interval === "monthly") {
    const first = firstWeekdayOnOrAfter(start, input.dayOfWeek);
    const occurrence = input.monthWeekdayOccurrence ?? weekdayOccurrenceInMonth(first);
    const out: string[] = [];
    let year = first.getUTCFullYear();
    let month = first.getUTCMonth();
    let guard = 0;
    while (guard < 240) {
      guard++;
      const occ = nthWeekdayOfMonth(year, month, input.dayOfWeek, occurrence);
      if (occ > end) break;
      if (occ >= start) out.push(toYmd(occ));
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
    return out;
  }

  const step = INTERVAL_STEP_DAYS[input.interval];
  const out: string[] = [];
  let cur = firstWeekdayOnOrAfter(start, input.dayOfWeek);
  let guard = 0;
  while (cur <= end && guard < 520) {
    guard++;
    out.push(toYmd(cur));
    cur = addUtcDays(cur, step);
  }
  return out;
}

export type RecurrenceSessionRow = {
  id: string;
  student_id: string;
  subject: string;
  session_date: string;
  session_time: string;
  status: string;
};

export type PlannedRecurrence = {
  studentId: string;
  subject: string;
  interval: RecurrenceInterval;
  dayOfWeek: number;
  monthWeekdayOccurrence: number | null;
  sessionTime: string;
  startDate: string;
  endDate: string;
  sessions: { id: string; detached: boolean }[];
};

export type RecurrenceBackfillPlan = {
  series: PlannedRecurrence[];
  linked: number;
  detached: number;
  unlinked: number;
};

const SERIES_GAP_LIMIT_DAYS = 21;

function majorityValue<T extends string | number>(
  rows: { value: T; date: string }[],
  tieBreak?: (a: T, b: T) => number
): T | null {
  const counts = new Map<T, { n: number; latest: string }>();
  for (const row of rows) {
    const prev = counts.get(row.value);
    if (!prev) counts.set(row.value, { n: 1, latest: row.date });
    else {
      prev.n += 1;
      if (row.date > prev.latest) prev.latest = row.date;
    }
  }
  let best: { value: T; n: number; latest: string } | null = null;
  for (const [value, info] of counts) {
    if (
      !best ||
      info.n > best.n ||
      (info.n === best.n &&
        (tieBreak
          ? tieBreak(value, best.value) < 0
          : info.latest > best.latest))
    ) {
      best = { value, n: info.n, latest: info.latest };
    }
  }
  return best?.value ?? null;
}

function inferInterval(gaps: number[]): RecurrenceInterval | null {
  const counts = new Map<number, number>([
    [7, 0],
    [14, 0],
    [21, 0],
  ]);
  for (const gap of gaps) {
    if (counts.has(gap)) counts.set(gap, (counts.get(gap) ?? 0) + 1);
  }
  const ranked = [7, 14, 21].sort(
    (a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a - b
  );
  const winner = ranked[0]!;
  if ((counts.get(winner) ?? 0) === 0) return null;
  if (winner === 7) return "weekly";
  if (winner === 14) return "biweekly";
  return "every_3_weeks";
}

function sessionSort(a: RecurrenceSessionRow, b: RecurrenceSessionRow): number {
  const date = a.session_date.localeCompare(b.session_date);
  if (date !== 0) return date;
  const time = a.session_time.localeCompare(b.session_time);
  if (time !== 0) return time;
  return a.id.localeCompare(b.id);
}

/**
 * Group existing sessions into recurrence parents.
 * Deleted sessions should be omitted by the caller. Rescheduled originals are
 * attached as detached when their date falls inside a run, and are ignored
 * when measuring gaps.
 */
export function planRecurrenceBackfill(
  sessions: RecurrenceSessionRow[],
  today: string
): RecurrenceBackfillPlan {
  const groups = new Map<string, RecurrenceSessionRow[]>();
  for (const session of sessions) {
    const key = `${session.student_id}\0${session.subject.trim().toLowerCase()}`;
    const list = groups.get(key);
    if (list) list.push(session);
    else groups.set(key, [session]);
  }

  const series: PlannedRecurrence[] = [];
  const assigned = new Set<string>();

  for (const group of groups.values()) {
    const active = group
      .filter((session) => session.status !== "rescheduled")
      .sort(sessionSort);
    const stubs = group.filter((session) => session.status === "rescheduled");

    const runs: RecurrenceSessionRow[][] = [];
    let current: RecurrenceSessionRow[] = [];
    for (const session of active) {
      const prev = current[current.length - 1];
      if (
        prev &&
        daysBetweenYmd(prev.session_date.slice(0, 10), session.session_date.slice(0, 10)) >
          SERIES_GAP_LIMIT_DAYS
      ) {
        runs.push(current);
        current = [session];
      } else {
        current.push(session);
      }
    }
    if (current.length > 0) runs.push(current);

    for (const run of runs) {
      if (run.length < 3) continue;
      const gaps: number[] = [];
      for (let i = 1; i < run.length; i++) {
        gaps.push(
          daysBetweenYmd(
            run[i - 1]!.session_date.slice(0, 10),
            run[i]!.session_date.slice(0, 10)
          )
        );
      }
      const interval = inferInterval(gaps);
      if (!interval || interval === "monthly") continue;

      const futurePlanned = run.filter(
        (session) =>
          session.status === "planned" && session.session_date.slice(0, 10) >= today
      );
      const ruleSource = futurePlanned.length > 0 ? futurePlanned : run;
      const dayOfWeek = majorityValue(
        ruleSource.map((session) => ({
          value: weekdayOfYmd(session.session_date),
          date: session.session_date,
        }))
      );
      const sessionTime = majorityValue(
        ruleSource.map((session) => ({
          value: normalizeSessionTime(session.session_time),
          date: session.session_date,
        }))
      );
      const subject = majorityValue(
        run.map((session) => ({
          value: session.subject.trim(),
          date: session.session_date,
        }))
      );
      if (dayOfWeek == null || !sessionTime || !subject) continue;

      const startDate = run[0]!.session_date.slice(0, 10);
      const endDate = run[run.length - 1]!.session_date.slice(0, 10);
      const linked = run.map((session) => ({
        id: session.id,
        detached: isBackfillDetached(session, dayOfWeek, sessionTime),
      }));

      for (const stub of stubs) {
        const date = stub.session_date.slice(0, 10);
        if (date < startDate || date > endDate) continue;
        if (assigned.has(stub.id) || linked.some((row) => row.id === stub.id)) continue;
        linked.push({ id: stub.id, detached: true });
      }

      series.push({
        studentId: run[0]!.student_id,
        subject,
        interval,
        dayOfWeek,
        monthWeekdayOccurrence: null,
        sessionTime,
        startDate,
        endDate,
        sessions: linked,
      });
      for (const row of linked) assigned.add(row.id);
    }
  }

  const detached = series.reduce(
    (count, item) => count + item.sessions.filter((session) => session.detached).length,
    0
  );
  const linked = assigned.size;
  return {
    series,
    linked,
    detached,
    unlinked: sessions.length - linked,
  };
}

function isBackfillDetached(
  session: RecurrenceSessionRow,
  dayOfWeek: number,
  sessionTime: string
): boolean {
  if (session.status === "rescheduled" || session.status === "planned_reschedule") {
    return true;
  }
  if (weekdayOfYmd(session.session_date) !== dayOfWeek) return true;
  if (normalizeSessionTime(session.session_time) !== sessionTime) return true;
  return false;
}

export type SeriesEditSession = {
  id: string;
  session_date: string;
  session_time: string;
  subject: string;
  status: string;
  recurrence_detached: boolean;
};

export type SeriesEditPlan = {
  updates: {
    id: string;
    session_date: string;
    session_time: string;
    subject: string;
  }[];
  creates: { session_date: string }[];
  cancels: string[];
};

/**
 * Future planned or in-progress sessions that are not detached are moved onto
 * the new rule. Dates that already have any other session in the series are
 * not reused. Extra future sessions are cancelled; missing dates are created.
 */
export function planSeriesEdit(input: {
  today: string;
  startDate: string;
  endDate: string;
  dayOfWeek: number;
  interval: RecurrenceInterval;
  monthWeekdayOccurrence: number | null;
  sessionTime: string;
  subject: string;
  sessions: SeriesEditSession[];
}): SeriesEditPlan {
  const time = normalizeSessionTime(input.sessionTime);
  const subject = input.subject.trim();
  const movable = input.sessions
    .filter(
      (session) =>
        !session.recurrence_detached &&
        (session.status === "planned" || session.status === "in_progress") &&
        session.session_date.slice(0, 10) >= input.today
    )
    .sort((a, b) => a.session_date.localeCompare(b.session_date) || a.id.localeCompare(b.id));
  const movableIds = new Set(movable.map((session) => session.id));
  const fixedDates = new Set(
    input.sessions
      .filter((session) => !movableIds.has(session.id))
      .map((session) => session.session_date.slice(0, 10))
  );
  const desired = recurrenceDates({
    startDate: input.startDate,
    endDate: input.endDate,
    dayOfWeek: input.dayOfWeek,
    interval: input.interval,
    monthWeekdayOccurrence: input.monthWeekdayOccurrence,
  }).filter((date) => date >= input.today && !fixedDates.has(date));

  const pairCount = Math.min(movable.length, desired.length);
  const updates: SeriesEditPlan["updates"] = [];
  for (let i = 0; i < pairCount; i++) {
    const session = movable[i]!;
    const sessionDate = desired[i]!;
    if (
      session.session_date.slice(0, 10) === sessionDate &&
      normalizeSessionTime(session.session_time) === time &&
      session.subject.trim() === subject
    ) {
      continue;
    }
    updates.push({
      id: session.id,
      session_date: sessionDate,
      session_time: time,
      subject,
    });
  }

  return {
    updates,
    creates: desired.slice(pairCount).map((session_date) => ({ session_date })),
    cancels: movable.slice(pairCount).map((session) => session.id),
  };
}
