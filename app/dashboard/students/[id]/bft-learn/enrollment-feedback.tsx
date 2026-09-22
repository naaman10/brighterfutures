"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Feedback = {
  id: string;
  feedback: string;
  createdBy: string;
  createdAt: string;
};

type Props = {
  enrollmentId: string;
  adminUserId: string;
  studentName: string;
};

export function EnrollmentFeedback({ enrollmentId, adminUserId, studentName }: Props) {
  const router = useRouter();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [newFeedback, setNewFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [enrollmentId]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/bft-learn/enrollment/${encodeURIComponent(enrollmentId)}/feedback`
      );
      
      if (response.ok) {
        const data = await response.json();
        setFeedbackList(data.feedback || []);
      }
    } catch (e) {
      console.error("Failed to load feedback:", e);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!newFeedback.trim()) {
      toast.error("Please enter feedback before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/bft-learn/enrollment/${encodeURIComponent(enrollmentId)}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feedback: newFeedback.trim(),
            createdBy: adminUserId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save feedback");
      }

      toast.success("Feedback saved successfully");
      setNewFeedback("");
      await loadFeedback();
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save feedback";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-6 space-y-4">
      {/* Existing Feedback */}
      {feedbackList.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Feedback History
          </h2>
          <div className="space-y-4">
            {feedbackList.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
              >
                <p className="whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-50">
                  {item.feedback}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Feedback */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Add Feedback for {studentName}
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="enrollment-feedback"
              className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50"
            >
              Feedback
            </label>
            <textarea
              id="enrollment-feedback"
              value={newFeedback}
              onChange={(e) => setNewFeedback(e.target.value)}
              placeholder="Provide feedback on this student's work..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              rows={6}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={submitFeedback}
              disabled={submitting || !newFeedback.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Feedback"}
            </button>
          </div>
        </div>
      </div>

      {loading && feedbackList.length === 0 && (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Loading feedback...
        </p>
      )}
    </section>
  );
}
