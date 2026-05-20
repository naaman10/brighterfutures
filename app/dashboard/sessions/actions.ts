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
