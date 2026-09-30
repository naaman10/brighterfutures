"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionButton, useActionLock } from "@/app/dashboard/components/action-button";
import { addStudentToParent } from "../../actions";

type Props = { parentId: string };

export function AddStudentForm({ parentId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const { pending, run } = useActionLock();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    await run(async () => {
      setError(null);
      const result = await addStudentToParent(parentId, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/dashboard/parents");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}
      <div className="surface">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
      </div>
      <div className="flex gap-3">
        <ActionButton
          type="submit"
          pending={pending}
          pendingLabel="Adding..."
          className="btn-primary"
        >
          Add student
        </ActionButton>
        <Link
          href="/dashboard/parents"
          className="btn-secondary"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
