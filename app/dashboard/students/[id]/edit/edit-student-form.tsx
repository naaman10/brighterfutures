"use client";

import { useState } from "react";
import Link from "next/link";
import type { StudentDetail } from "@/lib/db";

type Props = {
  student: StudentDetail;
  action: (studentId: string, formData: FormData) => Promise<{ error?: string }>;
};

/** Normalize for type="date" input (YYYY-MM-DD). DB may return Date. */
function toDateInputValue(val: unknown): string {
  if (val == null) return "";
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

/** Normalize for type="time" input (HH:MM). DB may return Date. */
function toTimeInputValue(val: unknown): string {
  if (val == null) return "";
  if (val instanceof Date) return val.toTimeString().slice(0, 5);
  if (typeof val === "string") return val.slice(0, 5);
  return "";
}

export function EditStudentForm({ student, action }: Props) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await action(student.id, formData);
    if (result.error) setError(result.error);
  }

  const dateValue = toDateInputValue(student.start_date);
  const timeValue = toTimeInputValue(student.start_time);
  const dobValue = toDateInputValue(student.dob);

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100";
  const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      )}
      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Basic details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first_name" className={labelClass}>
              First name *
            </label>
            <input
              id="first_name"
              name="first_name"
              required
              defaultValue={student.first_name}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="last_name" className={labelClass}>
              Last name *
            </label>
            <input
              id="last_name"
              name="last_name"
              required
              defaultValue={student.last_name}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="age" className={labelClass}>
              Age
            </label>
            <input
              id="age"
              name="age"
              type="number"
              min={0}
              max={120}
              defaultValue={student.age ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="dob" className={labelClass}>
              Date of birth
            </label>
            <input
              id="dob"
              name="dob"
              type="date"
              defaultValue={dobValue}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="start_date" className={labelClass}>
              Start date
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              defaultValue={dateValue}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="start_time" className={labelClass}>
              Start time
            </label>
            <input
              id="start_time"
              name="start_time"
              type="time"
              defaultValue={timeValue}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          School
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="current_school" className={labelClass}>
              Current school
            </label>
            <input
              id="current_school"
              name="current_school"
              defaultValue={student.current_school ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="current_year_group" className={labelClass}>
              Year group
            </label>
            <input
              id="current_year_group"
              name="current_year_group"
              defaultValue={student.current_year_group ?? ""}
              placeholder="e.g. Year 7"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="exam_board" className={labelClass}>
              Exam board
            </label>
            <input
              id="exam_board"
              name="exam_board"
              defaultValue={student.exam_board ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          SEN &amp; medical
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="sen_needs" className={labelClass}>
              SEN needs
            </label>
            <textarea
              id="sen_needs"
              name="sen_needs"
              rows={3}
              defaultValue={student.sen_needs ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="medical_conditions" className={labelClass}>
              Medical conditions
            </label>
            <textarea
              id="medical_conditions"
              name="medical_conditions"
              rows={3}
              defaultValue={student.medical_conditions ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="medication" className={labelClass}>
              Medication
            </label>
            <textarea
              id="medication"
              name="medication"
              rows={2}
              defaultValue={student.medication ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Collection
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="collector_name" className={labelClass}>
              Collector name
            </label>
            <input
              id="collector_name"
              name="collector_name"
              defaultValue={student.collector_name ?? ""}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="leave_independantly"
              name="leave_independantly"
              type="checkbox"
              defaultChecked={student.leave_independantly === true}
              value="on"
              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
            />
            <label htmlFor="leave_independantly" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Leave independently
            </label>
          </div>
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Save changes
        </button>
        <Link
          href={`/dashboard/students/${student.id}`}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
