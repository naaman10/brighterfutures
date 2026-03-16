"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SESSION_STATUSES, SESSION_STATUS_LABELS } from "@/lib/session-status";
import { addSessions } from "./actions";

const DAYS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

const INTERVALS = [
  { value: "1", label: "Every week" },
  { value: "2", label: "Every two weeks" },
  { value: "3", label: "Every three weeks" },
  { value: "monthly", label: "Monthly" },
] as const;

type Props = { studentId: string };

export function AddSessionForm({ studentId }: Props) {
  const [mode, setMode] = useState<"single" | "recurring">("single");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    formData.set("mode", mode);
    const result = await addSessions(studentId, formData);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    router.refresh();
    setIsSubmitting(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
        Add session(s)
      </h3>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Subject *
        </label>
        <input
          name="subject"
          required
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          placeholder="e.g. Maths"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Status
        </label>
        <select
          name="session_status"
          defaultValue="planned"
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {SESSION_STATUSES.map((value) => (
            <option key={value} value={value}>
              {SESSION_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode_radio"
            checked={mode === "single"}
            onChange={() => setMode("single")}
            className="rounded-full"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Single session</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode_radio"
            checked={mode === "recurring"}
            onChange={() => setMode("recurring")}
            className="rounded-full"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Recurring</span>
        </label>
      </div>
      {mode === "single" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Date *
            </label>
            <input
              name="session_date"
              type="date"
              required={mode === "single"}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Time *
            </label>
            <input
              name="session_time"
              type="time"
              required={mode === "single"}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Interval *
            </label>
            <select
              name="recurring_interval"
              required={mode === "recurring"}
              defaultValue="1"
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {INTERVALS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
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
              required={mode === "recurring"}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Time *
            </label>
            <input
              name="recurring_time"
              type="time"
              required={mode === "recurring"}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Start date
            </label>
            <input
              name="recurring_start_date"
              type="date"
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              End date (until) *
            </label>
            <input
              name="recurring_end_date"
              type="date"
              required={mode === "recurring"}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isSubmitting
          ? mode === "single"
            ? "Adding..."
            : "Adding sessions..."
          : mode === "single"
          ? "Add session"
          : "Add recurring sessions"}
      </button>
    </form>
  );
}
