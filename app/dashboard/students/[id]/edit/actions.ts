"use server";

import { redirect } from "next/navigation";
import { updateStudent } from "@/lib/db";

export async function updateStudentAction(
  studentId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const first_name = (formData.get("first_name") as string)?.trim() ?? "";
  const last_name = (formData.get("last_name") as string)?.trim() ?? "";
  if (!first_name || !last_name) return { error: "First name and last name are required" };
  const ageRaw = (formData.get("age") as string)?.trim();
  const age = ageRaw ? parseInt(ageRaw, 10) : null;
  const start_date = (formData.get("start_date") as string)?.trim() || null;
  const start_time = (formData.get("start_time") as string)?.trim() || null;
  const result = await updateStudent(studentId, {
    first_name,
    last_name,
    age: Number.isNaN(age) ? null : age,
    start_date,
    start_time,
  });
  if ("error" in result) return { error: result.error };
  redirect(`/dashboard/students/${studentId}`);
}
