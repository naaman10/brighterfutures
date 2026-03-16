"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addStudentToParent } from "../../actions";

type Props = { parentId: string };

export function AddStudentForm({ parentId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    const result = await addStudentToParent(parentId, formData);
    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    router.push("/dashboard/parents");
    router.refresh();
    setIsSubmitting(false);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="first_name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              First name *
            </label>
            <input
              id="first_name"
              name="first_name"
              required
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
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSubmitting ? "Adding..." : "Add student"}
        </button>
        <Link
          href="/dashboard/parents"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
