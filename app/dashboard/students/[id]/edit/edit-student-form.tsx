"use client";

import { useState } from "react";
import Link from "next/link";
import type { StudentDetail } from "@/lib/db";

type Props = {
  student: StudentDetail;
  action: (studentId: string, formData: FormData) => Promise<{ error?: string }>;
};

export function EditStudentForm({ student, action }: Props) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await action(student.id, formData);
    if (result.error) setError(result.error);
  }

  // Normalize dates/times from DB (Neon can return Date objects; inputs need strings)
  const dateValue =
    student.start_date == null
      ? ""
      : (student.start_date as unknown) instanceof Date
        ? (student.start_date as unknown as Date).toISOString().slice(0, 10)
        : String(student.start_date).slice(0, 10);

  const timeValue =
    student.start_time == null
      ? ""
      : (student.start_time as unknown) instanceof Date
        ? (student.start_time as unknown as Date).toTimeString().slice(0, 5)
        : typeof student.start_time === "string"
          ? student.start_time.slice(0, 5)
          : "";

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      )}
      <div className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            First name *
          </label>
          <input
            id="first_name"
            name="first_name"
            required
            defaultValue={student.first_name}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="last_name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Last name *
          </label>
          <input
            id="last_name"
            name="last_name"
            required
            defaultValue={student.last_name}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="age" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Age
          </label>
          <input
            id="age"
            name="age"
            type="number"
            min={0}
            max={120}
            defaultValue={student.age ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="start_date" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Start date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={dateValue}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="start_time" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Start time
          </label>
          <input
            id="start_time"
            name="start_time"
            type="time"
            defaultValue={timeValue}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>
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
