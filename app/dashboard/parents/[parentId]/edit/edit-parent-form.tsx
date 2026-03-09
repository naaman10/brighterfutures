"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ParentBasic } from "@/lib/db";
import { updateParentAction } from "../actions";

type EditParentFormProps = {
  parent: ParentBasic;
};

export function EditParentForm({ parent }: EditParentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await updateParentAction(parent.id, formData);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.push("/dashboard/parents");
  }

  return (
    <form action={handleSubmit} className="max-w-md space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label htmlFor="first_name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            First name *
          </label>
          <input
            id="first_name"
            name="first_name"
            required
            defaultValue={parent.first_name ?? ""}
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
            defaultValue={parent.last_name ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={parent.email ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="contact_number" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Contact number
          </label>
          <input
            id="contact_number"
            name="contact_number"
            type="tel"
            defaultValue={parent.contact_number ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="session_rate" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Session rate (£)
          </label>
          <input
            id="session_rate"
            name="session_rate"
            type="number"
            min={0}
            step={0.01}
            placeholder="e.g. 45"
            defaultValue={parent.session_rate ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          Save changes
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
