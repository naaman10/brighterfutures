"use server";

import { redirect } from "next/navigation";
import { createParent, createStudent } from "@/lib/db";

type StudentEntry = {
  first_name: string;
  last_name: string;
  age?: number | null;
};

export async function addParentWithStudents(formData: FormData) {
  const sessionRateRaw = (formData.get("parent_session_rate") as string)?.trim();
  const sessionRate =
    sessionRateRaw && sessionRateRaw.length > 0
      ? Number.isNaN(Number(sessionRateRaw))
        ? null
        : Number(sessionRateRaw)
      : null;

  const parentResult = await createParent({
    first_name: (formData.get("parent_first_name") as string)?.trim() ?? "",
    last_name: (formData.get("parent_last_name") as string)?.trim() ?? "",
    email: (formData.get("parent_email") as string)?.trim() ?? "",
    contact_number: (formData.get("parent_contact_number") as string)?.trim() || null,
    session_rate: sessionRate,
  });

  if ("error" in parentResult) {
    return { error: parentResult.error };
  }

  const parentId = parentResult.id;
  const studentsJson = formData.get("students") as string | null;
  const students: StudentEntry[] = studentsJson ? JSON.parse(studentsJson) : [];

  for (const s of students) {
    const firstName = s?.first_name?.trim();
    const lastName = s?.last_name?.trim();
    if (!firstName || !lastName) continue;
    const result = await createStudent(parentId, {
      first_name: firstName,
      last_name: lastName,
      age: s?.age ?? null,
    });
    if ("error" in result) {
      return { error: `Parent created but failed to add student: ${result.error}` };
    }
  }

  redirect("/dashboard");
}
