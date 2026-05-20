"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { addGoogleMeetAction } from "./actions";

type Props = {
  sessionId: string;
  studentId: string;
};

export function AddGoogleMeetButton({ sessionId, studentId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const result = await addGoogleMeetAction(sessionId, studentId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.alreadyConfigured) {
        toast.info("Google Meet and parent invite are already on this event.");
        return;
      }
      if (result.meetLink) {
        toast.success("Google Meet added and parent invited.", {
          description: result.meetLink,
          duration: 8000,
        });
      } else {
        toast.success("Google Meet added and parent invited.");
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
    >
      {loading ? "Adding…" : "Add Google Meet"}
    </button>
  );
}
