"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDisplayDate, formatDisplayTime } from "@/lib/format";
import {
  RECURRENCE_INTERVALS,
  RECURRENCE_INTERVAL_LABELS,
  normalizeSessionTime,
  type SessionRecurrence,
} from "@/lib/session-recurrence";
import { updateSessionRecurrenceAction } from "./recurrence-actions";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const OCCURRENCES = [
  { value: "1", label: "First" },
  { value: "2", label: "Second" },
  { value: "3", label: "Third" },
  { value: "4", label: "Fourth" },
  { value: "5", label: "Fifth" },
];

type Props = {
  studentId: string;
  recurrences: SessionRecurrence[];
};

export function SessionRecurrences({ studentId, recurrences }: Props) {
  if (recurrences.length === 0) return null;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Recurring sessions
        </h3>
      </div>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {recurrences.map((recurrence) => (
          <RecurrenceRow key={recurrence.id} studentId={studentId} recurrence={recurrence} />
        ))}
      </ul>
    </section>
  );
}

function RecurrenceRow({
  studentId,
  recurrence,
}: {
  studentId: string;
  recurrence: SessionRecurrence;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [seriesInterval, setSeriesInterval] = useState(recurrence.interval);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dayLabel = DAYS[recurrence.day_of_week] ?? "Day";

  async function handleSubmit(formData: FormData) {
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await updateSessionRecurrenceAction(
      studentId,
      recurrence.id,
      formData
    );
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.calendarWarning) toast.warning(result.calendarWarning);
    else toast.success("Recurring sessions updated.");
    setEditing(false);
    router.refresh();
  }

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {recurrence.subject}
          </p>
          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
            {RECURRENCE_INTERVAL_LABELS[recurrence.interval]} on {dayLabel} at{" "}
            {formatDisplayTime(recurrence.session_time) || "—"} until{" "}
            {formatDisplayDate(recurrence.end_date) || "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing((open) => !open);
            setError(null);
            setSeriesInterval(recurrence.interval);
          }}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          {editing ? "Close" : "Edit series"}
        </button>
      </div>
      {editing && (
        <form action={handleSubmit} className="mt-4 space-y-4">
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Subject *
              </label>
              <input
                name="subject"
                type="text"
                required
                defaultValue={recurrence.subject}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Interval *
              </label>
              <select
                name="interval"
                required
                value={seriesInterval}
                onChange={(event) =>
                  setSeriesInterval(event.target.value as SessionRecurrence["interval"])
                }
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              >
                {RECURRENCE_INTERVALS.map((value) => (
                  <option key={value} value={value}>
                    {RECURRENCE_INTERVAL_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Day of week *
              </label>
              <select
                name="day_of_week"
                required
                defaultValue={String(recurrence.day_of_week)}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              >
                {DAYS.map((label, index) => (
                  <option key={label} value={String(index)}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {seriesInterval === "monthly" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Week of month *
                </label>
                <select
                  name="month_weekday_occurrence"
                  required
                  defaultValue={String(recurrence.month_weekday_occurrence ?? 1)}
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {OCCURRENCES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Time *
              </label>
              <input
                name="session_time"
                type="time"
                required
                defaultValue={normalizeSessionTime(recurrence.session_time)}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Until *
              </label>
              <input
                name="end_date"
                type="date"
                required
                defaultValue={recurrence.end_date.slice(0, 10)}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? "Saving…" : "Save series"}
          </button>
        </form>
      )}
    </li>
  );
}
