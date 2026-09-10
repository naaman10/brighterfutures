"use server";

import { revalidatePath } from "next/cache";
import { createBftLearnAccount as callCreateBftLearnAccount } from "@/lib/bft-learn";
import { getStudentById } from "@/lib/db";

export async function createBftLearnAccount(
  studentId: string,
  input: { email: string; name: string }
): Promise<{ error?: string }> {
  try {
    const email = input?.email?.trim() ?? "";
    const name = input?.name?.trim() ?? "";

    if (!email) return { error: "Email is required." };
    if (!name) return { error: "Name is required." };

    const student = await getStudentById(studentId);
    if (!student) return { error: "Student not found." };
    if (student.neon_user_id) {
      return { error: "This student already has a BFT Learn account." };
    }

    const result = await callCreateBftLearnAccount({ studentId, email, name });
    if ("error" in result) return { error: result.error };

    revalidatePath(`/dashboard/students/${studentId}`);
    return {};
  } catch (e) {
    console.error("[createBftLearnAccount]", e);
    return {
      error: e instanceof Error ? e.message : "Failed to create BFT Learn account.",
    };
  }
}
