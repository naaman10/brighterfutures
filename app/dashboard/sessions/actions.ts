"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { performDeleteSession } from "@/lib/delete-session";

export type DeleteSessionRedirect =
  | { type: "sessions" }
  | { type: "student"; studentId: string };

export async function deleteSessionAction(
  sessionId: string,
  studentId: string,
  redirectTo: DeleteSessionRedirect
): Promise<{ error?: string }> {
  const result = await performDeleteSession(sessionId, studentId);
  if (result.error) return result;

  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath(`/dashboard/students/${studentId}/sessions/${sessionId}`);

  if (redirectTo.type === "sessions") {
    redirect("/dashboard/sessions");
  }
  if (redirectTo.type === "student") {
    redirect(`/dashboard/students/${studentId}`);
  }
  redirect(`/dashboard/students/${studentId}`);
}

export async function deleteSelectedSessionsAction(
  studentId: string,
  sessionIds: string[]
): Promise<{ ok?: boolean; deleted?: number; error?: string }> {
  if (sessionIds.length === 0) {
    return { ok: false, error: "No sessions selected." };
  }

  let deleted = 0;
  for (const sessionId of sessionIds) {
    const result = await performDeleteSession(sessionId, studentId);
    if (result.error) {
      return {
        ok: false,
        deleted,
        error:
          deleted > 0
            ? `${result.error} (${deleted} session${deleted !== 1 ? "s" : ""} deleted before this error.)`
            : result.error,
      };
    }
    deleted++;
  }

  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/students/${studentId}`);

  return { ok: true, deleted };
}
