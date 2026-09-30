"use client";

import { useState } from "react";
import Link from "next/link";
import { addParentWithStudents } from "./actions";

type StudentRow = {
  first_name: string;
  last_name: string;
  age: string;
};

const emptyStudent: StudentRow = {
  first_name: "",
  last_name: "",
  age: "",
};

export function AddParentForm() {
  const [students, setStudents] = useState<StudentRow[]>([{ ...emptyStudent }]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    const toSend = students
      .map((s) => ({
        first_name: s.first_name.trim(),
        last_name: s.last_name.trim(),
        age: s.age.trim() ? parseInt(s.age, 10) || null : null,
      }))
      .filter((s) => s.first_name || s.last_name);
    formData.set("students", JSON.stringify(toSend));
    const result = await addParentWithStudents(formData);
    if (result && "error" in result) {
      setError(result.error);
    }

    setIsSubmitting(false);
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}
      <section className="surface">
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
          <div>
            <label htmlFor="parent_session_rate" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Session rate (£)
            </label>
            <input
              id="parent_session_rate"
              name="parent_session_rate"
              type="number"
              min={0}
              step={0.01}
              defaultValue={32}
              placeholder="e.g. 32"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      </section>

      <section className="surface">
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
              className="grid gap-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700 sm:grid-cols-2 lg:grid-cols-4"
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
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? "Adding..." : "Add parent"}
        </button>
        <Link
          href="/dashboard"
          className="btn-secondary"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
