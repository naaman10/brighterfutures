"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBftLearnAccount } from "./bft-learn-actions";

type Props = {
  studentId: string;
  defaultName: string;
};

export function CreateBftLearnAccountForm({ studentId, defaultName }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string)?.trim() ?? "";
    const name = (formData.get("name") as string)?.trim() ?? "";

    try {
      const result = await createBftLearnAccount(studentId, { email, name });
      if (result?.error) {
        setError(result.error);
        return;
      }

      toast.success("BFT Learn account created.");
      router.refresh();
    } catch (e) {
      console.error("[CreateBftLearnAccountForm]", e);
      setError(
        e instanceof Error ? e.message : "Failed to create BFT Learn account."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="bft-learn-email"
          className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          Email *
        </label>
        <input
          id="bft-learn-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full max-w-md rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label
          htmlFor="bft-learn-name"
          className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
        >
          Name *
        </label>
        <input
          id="bft-learn-name"
          name="name"
          type="text"
          required
          defaultValue={defaultName}
          className="w-full max-w-md rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isSubmitting ? "Creating…" : "Create BFT Learn account"}
      </button>
    </form>
  );
}
