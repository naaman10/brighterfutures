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
      className="btn-secondary"
    >
      {loading ? "Adding…" : "Add Google Meet"}
    </button>
  );
}
