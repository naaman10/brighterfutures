"use server";

import { redirect } from "next/navigation";
import { updateStudent } from "@/lib/db";

function trimOrNull(value: FormDataEntryValue | null): string | null {
  const s = (value as string)?.trim();
  return s === "" ? null : s ?? null;
}

export async function updateStudentAction(
  studentId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const first_name = (formData.get("first_name") as string)?.trim() ?? "";
  const last_name = (formData.get("last_name") as string)?.trim() ?? "";
  if (!first_name || !last_name) return { error: "First name and last name are required" };
  const ageRaw = (formData.get("age") as string)?.trim();
  const age = ageRaw ? parseInt(ageRaw, 10) : null;
  const start_date = trimOrNull(formData.get("start_date"));
  const start_time = trimOrNull(formData.get("start_time"));
  const dob = trimOrNull(formData.get("dob"));
  const current_school = trimOrNull(formData.get("current_school"));
  const current_year_group = trimOrNull(formData.get("current_year_group"));
  const sen_needs = trimOrNull(formData.get("sen_needs"));
  const exam_board = trimOrNull(formData.get("exam_board"));
  const medical_conditions = trimOrNull(formData.get("medical_conditions"));
  const medication = trimOrNull(formData.get("medication"));
  const collector_name = trimOrNull(formData.get("collector_name"));
  const leave_independantly = formData.get("leave_independantly") === "on";

  const result = await updateStudent(studentId, {
    first_name,
    last_name,
    age: Number.isNaN(age ?? NaN) ? null : age ?? null,
    start_date,
    start_time,
    dob,
    current_school,
    current_year_group,
    sen_needs,
    exam_board,
    medical_conditions,
    medication,
    collector_name,
    leave_independantly,
  });
  if ("error" in result) return { error: result.error };
  redirect(`/dashboard/students/${studentId}`);
}
