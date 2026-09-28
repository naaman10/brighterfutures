/**
 * Group existing sessions into recurrence parents.
 *
 * Dry run (default):
 *   node --experimental-strip-types scripts/backfill-session-recurrences.ts
 *
 * Apply:
 *   node --experimental-strip-types scripts/backfill-session-recurrences.ts --apply
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { planRecurrenceBackfill } from "../lib/session-recurrence.ts";

function loadEnv(path: string) {
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function londonToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

loadEnv(".env.local");
const sql = neon(process.env.DATABASE_URL!);
const apply = process.argv.includes("--apply");

const rows = await sql`
  SELECT
    id,
    student_id,
    subject,
    (session_date::date)::text AS session_date,
    session_time::text AS session_time,
    status
  FROM sessions
  WHERE status <> 'deleted'
    AND recurrence_id IS NULL
`;

const plan = planRecurrenceBackfill(
  rows as {
    id: string;
    student_id: string;
    subject: string;
    session_date: string;
    session_time: string;
    status: string;
  }[],
  londonToday()
);

const intervals: Record<string, number> = {};
for (const series of plan.series) {
  intervals[series.interval] = (intervals[series.interval] ?? 0) + 1;
}

console.log(
  JSON.stringify(
    {
      mode: apply ? "apply" : "dry-run",
      series: plan.series.length,
      linked: plan.linked,
      detached: plan.detached,
      unlinked: plan.unlinked,
      intervals,
    },
    null,
    2
  )
);

if (!apply) {
  console.log("Dry run only. Re-run with --apply to write recurrence parents.");
  process.exit(0);
}

for (const series of plan.series) {
  const inserted = await sql`
    INSERT INTO session_recurrences (
      student_id,
      subject,
      interval,
      day_of_week,
      month_weekday_occurrence,
      session_time,
      start_date,
      end_date
    )
    VALUES (
      ${series.studentId},
      ${series.subject},
      ${series.interval},
      ${series.dayOfWeek},
      ${series.monthWeekdayOccurrence},
      ${series.sessionTime},
      ${series.startDate}::date,
      ${series.endDate}::date
    )
    RETURNING id
  `;
  const recurrenceId = (inserted[0] as { id: string }).id;
  for (const session of series.sessions) {
    await sql`
      UPDATE sessions
      SET recurrence_id = ${recurrenceId},
          recurrence_detached = ${session.detached},
          updated_at = NOW()
      WHERE id = ${session.id}
        AND recurrence_id IS NULL
    `;
  }
}

console.log(`Applied ${plan.series.length} recurrence parents.`);
