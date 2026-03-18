import Link from "next/link";
import { getSessions, SESSION_STATUS_LABELS } from "@/lib/db";
import { formatDisplayDate, formatDisplayTime } from "@/lib/format";
import { SessionStatusFilter } from "./session-status-filter";
import { BirthdayEmoji } from "./birthday-emoji";

const VALID_STATUSES = ["planned", "in_progress", "completed", "rescheduled", "planned_reschedule"] as const;

function parseStatus(status: string | undefined): string | null {
  if (!status) return null;
  return VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number]) ? status : null;
}

export const dynamic = "force-dynamic";

function parseYmd(value: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function utcDateFromYmd(ymd: { y: number; m: number; d: number }): Date {
  return new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d));
}

function formatWeekdayDay(date: Date): string {
  // Always format in Europe/London for consistent day/weekday.
  const fmt = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    timeZone: "Europe/London",
  });
  // "Monday, 01" -> "Monday 01"
  return fmt.format(date).replace(",", "");
}

function diffDaysUtc(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((a.getTime() - b.getTime()) / msPerDay);
}

type BirthdayMatch = {
  birthdayDate: Date;
  diffDays: number; // sessionDate - birthdayDate
  absDiffDays: number;
  tooltip: string;
};

function getBirthdayMatch(sessionDateYmd: string, dobYmd: string | null): BirthdayMatch | null {
  if (!dobYmd) return null;
  const session = parseYmd(sessionDateYmd);
  const dob = parseYmd(dobYmd);
  if (!session || !dob) return null;

  const sessionDate = utcDateFromYmd(session);

  // Birthday for the session year, plus adjacent years for early/late-year sessions.
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

  if (closestAbs > 5) return null;

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

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }> | { status?: string };
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const statusFilter = parseStatus(params?.status);

  let sessions: Awaited<ReturnType<typeof getSessions>> = [];
  let dbError: string | null = null;

  try {
    sessions = await getSessions(statusFilter);
  } catch (e) {
    dbError =
      e instanceof Error ? e.message : "Failed to load sessions from database.";
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Sessions
      </h1>

      {dbError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {dbError}
        </div>
      )}

      {!dbError && sessions.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-6 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          No sessions yet. Add sessions from a student&apos;s page.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Filter by status:</span>
            <SessionStatusFilter currentStatus={statusFilter} />
          </div>
          {(() => {
            // For each student, choose ONE closest session within ±5 days of birthday.
            const bestByStudent = new Map<
              string,
              { sessionId: string; match: BirthdayMatch }
            >();

            for (const s of sessions) {
              const match = getBirthdayMatch(s.session_date, s.student_dob);
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
                // Tie-break: prefer the session BEFORE the birthday (diffDays < 0).
                const matchBefore = match.diffDays < 0;
                const prevBefore = prev.match.diffDays < 0;
                if (matchBefore && !prevBefore) {
                  bestByStudent.set(s.student_id, { sessionId: s.id, match });
                } else if (matchBefore === prevBefore) {
                  // Stable tie-breaker: pick earlier session date/time by keeping existing
                  // (sessions are already ordered ASC).
                }
              }
            }

            const birthdaySessionIdToTooltip = new Map<string, string>();
            for (const { sessionId, match } of bestByStudent.values()) {
              birthdaySessionIdToTooltip.set(sessionId, match.tooltip);
            }

            return (
              <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="overflow-x-auto overflow-y-visible">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                        <div className="flex items-center gap-2">
                          <span>{formatDisplayDate(session.session_date) || "—"}</span>
                          {(() => {
                            const tooltip = birthdaySessionIdToTooltip.get(session.id) ?? null;
                            if (!tooltip) return null;
                            return <BirthdayEmoji tooltip={tooltip} />;
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                        {formatDisplayTime(session.session_time) || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                        <Link
                          href={`/dashboard/students/${session.student_id}`}
                          className="font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                        >
                          {session.student_first_name} {session.student_last_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                        {session.subject}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {SESSION_STATUS_LABELS[session.status ?? "planned"]}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/students/${session.student_id}/sessions/${session.id}`}
                          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
