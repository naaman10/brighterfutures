"use server";

import { revalidatePath } from "next/cache";
import { createStudent, updateParent } from "@/lib/db";

export async function addStudentToParent(
  parentId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const first_name = (formData.get("first_name") as string)?.trim();
  const last_name = (formData.get("last_name") as string)?.trim();
  if (!first_name || !last_name) {
    return { error: "First name and last name are required." };
  }

  const ageStr = (formData.get("age") as string)?.trim();
  const age = ageStr ? parseInt(ageStr, 10) || null : null;
  const start_date = (formData.get("start_date") as string)?.trim() || null;
  const start_time = (formData.get("start_time") as string)?.trim() || null;

  const result = await createStudent(parentId, {
    first_name,
    last_name,
    age,
    start_date,
    start_time,
  });

  if ("error" in result) return { error: result.error };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/parents");
  revalidatePath("/dashboard/students");
  return {};
}

export async function updateParentAction(
  parentId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const first_name = (formData.get("first_name") as string)?.trim() ?? "";
  const last_name = (formData.get("last_name") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim() ?? "";
  const contact_number = (formData.get("contact_number") as string)?.trim() || null;
  const sessionRateRaw = (formData.get("session_rate") as string)?.trim();
  const session_rate = sessionRateRaw ? parseFloat(sessionRateRaw) || null : null;

  if (!first_name || !last_name || !email) {
    return { error: "First name, last name, and email are required." };
  }

  const result = await updateParent(parentId, {
    first_name,
    last_name,
    email,
    contact_number,
    session_rate,
  });

  if ("error" in result) return { error: result.error };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/parents");
  revalidatePath("/dashboard/invoices");
  return {};
}
