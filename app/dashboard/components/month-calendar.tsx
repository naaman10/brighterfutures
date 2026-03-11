import Link from "next/link";
import type { SessionWithStudent } from "@/lib/db";
import { SESSION_STATUS_LABELS } from "@/lib/session-status";
import { formatDisplayTime } from "@/lib/format";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Props = {
  year: number;
  month: number;
  sessions: SessionWithStudent[];
};

function getMonthGrid(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const firstWeekday = first.getDay();
  const lastDate = last.getDate();
  // getDay: 0=Sun, 1=Mon, ... 6=Sat. We use Mon=0, so Mon=1 -> 0, Tue=2 -> 1, ..., Sun=0 -> 6
  const monBased = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const leadingBlanks = monBased;
  const totalCells = leadingBlanks + lastDate;
  const rows = Math.ceil(totalCells / 7);
  const grid: (number | null)[][] = [];
  let day = 1;
  for (let r = 0; r < rows; r++) {
    const row: (number | null)[] = [];
    for (let c = 0; c < 7; c++) {
      const idx = r * 7 + c;
      if (idx < leadingBlanks || day > lastDate) {
        row.push(null);
      } else {
        row.push(day);
        day++;
      }
    }
    grid.push(row);
  }
  return grid;
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toDateKey(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const d = value instanceof Date ? value : new Date(String(value));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MonthCalendar({ year, month, sessions }: Props) {
  const grid = getMonthGrid(year, month);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const sessionsByDate = new Map<string, SessionWithStudent[]>();
  for (const s of sessions) {
    const d = toDateKey(s.session_date);
    if (!sessionsByDate.has(d)) sessionsByDate.set(d, []);
    sessionsByDate.get(d)!.push(s);
  }

  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const prevMonthParam = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const nextMonthParam = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <Link
          href={`/dashboard?month=${prevMonthParam}`}
          className="rounded px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-50"
          aria-label="Previous month"
        >
          ←
        </Link>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <Link
          href={`/dashboard?month=${nextMonthParam}`}
          className="rounded px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-50"
          aria-label="Next month"
        >
          →
        </Link>
      </div>
      <div className="overflow-x-auto p-4">
        <table className="w-full min-w-[400px] table-fixed">
          <thead>
            <tr>
              {WEEKDAYS.map((d) => (
                <th
                  key={d}
                  className="pb-2 text-center text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((day, colIdx) => {
                  if (day === null) {
                    return (
                      <td
                        key={colIdx}
                        className="h-24 border border-zinc-100 p-1 align-top dark:border-zinc-700"
                      />
                    );
                  }
                  const dk = dateKey(year, month, day);
                  const daySessions = sessionsByDate.get(dk) ?? [];
                  const isToday = dk === todayStr;
                  return (
                    <td
                      key={colIdx}
                      className={`h-24 min-h-[6rem] border border-zinc-200 p-1 align-top dark:border-zinc-700 ${
                        isToday ? "bg-amber-50 dark:bg-amber-950/20" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`text-xs font-medium ${
                            isToday
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {day}
                        </span>
                        <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
                          {daySessions.map((s) => (
                            <Link
                              key={s.id}
                              href={`/dashboard/students/${s.student_id}/sessions/${s.id}`}
                              className="block truncate rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-xs hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                              title={`${formatDisplayTime(s.session_time)} ${s.student_first_name} ${s.student_last_name} – ${s.subject} (${SESSION_STATUS_LABELS[s.status ?? "planned"]})`}
                            >
                              <span className="text-zinc-500 dark:text-zinc-400">
                                {formatDisplayTime(s.session_time)}
                              </span>{" "}
                              {s.student_first_name} {s.student_last_name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
