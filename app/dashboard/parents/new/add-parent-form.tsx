"use client";

import { useState } from "react";
import Link from "next/link";
import { addParentWithStudents } from "./actions";

type StudentRow = {
  first_name: string;
  last_name: string;
  age: string;
  start_date: string;
  start_time: string;
};

const emptyStudent: StudentRow = {
  first_name: "",
  last_name: "",
  age: "",
  start_date: "",
  start_time: "",
};

export function AddParentForm() {
  const [students, setStudents] = useState<StudentRow[]>([{ ...emptyStudent }]);
  const [error, setError] = useState<string | null>(null);

  function addStudent() {
    setStudents((prev) => [...prev, { ...emptyStudent }]);
  }

  function removeStudent(index: number) {
    setStudents((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStudent(index: number, field: keyof StudentRow, value: string) {
    setStudents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    const toSend = students
      .map((s) => ({
        first_name: s.first_name.trim(),
        last_name: s.last_name.trim(),
        age: s.age.trim() ? parseInt(s.age, 10) || null : null,
        start_date: s.start_date.trim() || null,
        start_time: s.start_time.trim() || null,
      }))
      .filter((s) => s.first_name || s.last_name);
    formData.set("students", JSON.stringify(toSend));
    const result = await addParentWithStudents(formData);
    if (result && "error" in result) setError(result.error);
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}
      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Parent details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="parent_first_name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              First name *
            </label>
            <input
              id="parent_first_name"
              name="parent_first_name"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="parent_last_name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Last name *
            </label>
            <input
              id="parent_last_name"
              name="parent_last_name"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="parent_email" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email *
            </label>
            <input
              id="parent_email"
              name="parent_email"
              type="email"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="parent_contact_number" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Contact number
            </label>
            <input
              id="parent_contact_number"
              name="parent_contact_number"
              type="tel"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Students (optional)
          </h2>
          <button
            type="button"
            onClick={addStudent}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            + Add another child
          </button>
        </div>
        <div className="space-y-4">
          {students.map((student, index) => (
            <div
              key={index}
              className="grid gap-4 rounded border border-zinc-200 p-3 dark:border-zinc-700 sm:grid-cols-2 lg:grid-cols-6"
            >
              <input
                placeholder="First name"
                value={student.first_name}
                onChange={(e) => updateStudent(index, "first_name", e.target.value)}
                className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                placeholder="Last name"
                value={student.last_name}
                onChange={(e) => updateStudent(index, "last_name", e.target.value)}
                className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                placeholder="Age"
                type="number"
                min={0}
                max={120}
                value={student.age}
                onChange={(e) => updateStudent(index, "age", e.target.value)}
                className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                placeholder="Start date"
                type="date"
                value={student.start_date}
                onChange={(e) => updateStudent(index, "start_date", e.target.value)}
                className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                placeholder="Start time"
                type="time"
                value={student.start_time}
                onChange={(e) => updateStudent(index, "start_time", e.target.value)}
                className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <div className="flex items-center">
                {students.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeStudent(index)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add parent
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
