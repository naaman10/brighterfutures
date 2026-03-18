type Ymd = { y: number; m: number; d: number };

function parseYmd(value: string): Ymd | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function utcDateFromYmd(ymd: Ymd): Date {
  return new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d));
}

function diffDaysUtc(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((a.getTime() - b.getTime()) / msPerDay);
}

function formatWeekdayDay(date: Date): string {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    timeZone: "Europe/London",
  });
  return fmt.format(date).replace(",", "");
}

export type BirthdayMatch = {
  birthdayDate: Date;
  diffDays: number; // sessionDate - birthdayDate
  absDiffDays: number;
  tooltip: string;
};

/**
 * Returns a birthday match for this session date if within ±windowDays.
 * Handles year boundaries by checking the birthday in sessionYear±1.
 */
export function getBirthdayMatchForSession(
  sessionDateYmd: string,
  dobYmd: string | null,
  windowDays = 5
): BirthdayMatch | null {
  if (!dobYmd) return null;
  const session = parseYmd(sessionDateYmd);
  const dob = parseYmd(dobYmd);
  if (!session || !dob) return null;

  const sessionDate = utcDateFromYmd(session);
  const candidates = [
    utcDateFromYmd({ y: session.y - 1, m: dob.m, d: dob.d }),
    utcDateFromYmd({ y: session.y, m: dob.m, d: dob.d }),
    utcDateFromYmd({ y: session.y + 1, m: dob.m, d: dob.d }),
  ];

  let closest = candidates[0]!;
  let closestAbs = Math.abs(diffDaysUtc(sessionDate, closest));
  for (const c of candidates.slice(1)) {
    const abs = Math.abs(diffDaysUtc(sessionDate, c));
    if (abs < closestAbs) {
      closest = c;
      closestAbs = abs;
    }
  }

  if (closestAbs > windowDays) return null;

  const diffDays = diffDaysUtc(sessionDate, closest);
  const birthdayLabel = formatWeekdayDay(closest);
  const isFuture = diffDays < 0;
  const tooltip = isFuture
    ? `The student's birthday is on the ${birthdayLabel}`
    : `The student's birthday was on ${birthdayLabel}`;

  return {
    birthdayDate: closest,
    diffDays,
    absDiffDays: Math.abs(diffDays),
    tooltip,
  };
}

type SessionLike = {
  id: string;
  session_date: string;
};

/**
 * Choose ONE session id to decorate with 🎉 for a single student.
 * Tie-break (equal distance): choose the session BEFORE the birthday.
 * Assumes `sessions` are sorted ascending by date/time; if fully tied, earlier row wins.
 */
export function pickBirthdaySessionIdForStudent(
  sessions: SessionLike[],
  dobYmd: string | null,
  windowDays = 5
): { sessionId: string; tooltip: string } | null {
  let best: { sessionId: string; match: BirthdayMatch } | null = null;
  for (const s of sessions) {
    const match = getBirthdayMatchForSession(s.session_date, dobYmd, windowDays);
    if (!match) continue;
    if (!best) {
      best = { sessionId: s.id, match };
      continue;
    }
    if (match.absDiffDays < best.match.absDiffDays) {
      best = { sessionId: s.id, match };
      continue;
    }
    if (match.absDiffDays === best.match.absDiffDays) {
      const matchBefore = match.diffDays < 0;
      const bestBefore = best.match.diffDays < 0;
      if (matchBefore && !bestBefore) best = { sessionId: s.id, match };
    }
  }
  return best ? { sessionId: best.sessionId, tooltip: best.match.tooltip } : null;
}

type SessionWithStudentLike = SessionLike & {
  student_id: string;
  student_dob: string | null;
};

/**
 * Choose ONE session per student id to decorate with 🎉.
 */
export function pickBirthdaySessionIdByStudent(
  sessions: SessionWithStudentLike[],
  windowDays = 5
): Map<string, string> {
  const bestByStudent = new Map<string, { sessionId: string; match: BirthdayMatch }>();

  for (const s of sessions) {
    const match = getBirthdayMatchForSession(s.session_date, s.student_dob, windowDays);
    if (!match) continue;

    const prev = bestByStudent.get(s.student_id);
    if (!prev) {
      bestByStudent.set(s.student_id, { sessionId: s.id, match });
      continue;
    }

    if (match.absDiffDays < prev.match.absDiffDays) {
      bestByStudent.set(s.student_id, { sessionId: s.id, match });
      continue;
    }

    if (match.absDiffDays === prev.match.absDiffDays) {
      const matchBefore = match.diffDays < 0;
      const prevBefore = prev.match.diffDays < 0;
      if (matchBefore && !prevBefore) {
        bestByStudent.set(s.student_id, { sessionId: s.id, match });
      }
    }
  }

  const bySessionId = new Map<string, string>();
  for (const { sessionId, match } of bestByStudent.values()) {
    bySessionId.set(sessionId, match.tooltip);
  }
  return bySessionId;
}

