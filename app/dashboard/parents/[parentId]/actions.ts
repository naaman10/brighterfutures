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

function trimOrNull(value: FormDataEntryValue | null): string | null {
  const s = (value as string)?.trim();
  return s === "" ? null : s ?? null;
}

export async function updateParentAction(
  parentId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const first_name = (formData.get("first_name") as string)?.trim() ?? "";
  const last_name = (formData.get("last_name") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim() ?? "";
  const contact_number = trimOrNull(formData.get("contact_number"));
  const sessionRateRaw = (formData.get("session_rate") as string)?.trim();
  const session_rate = sessionRateRaw ? parseFloat(sessionRateRaw) || null : null;
  const relationship = trimOrNull(formData.get("relationship"));
  const secondary_contact_number = trimOrNull(formData.get("secondary_contact_number"));
  const address_line_1 = trimOrNull(formData.get("address_line_1"));
  const address_line_2 = trimOrNull(formData.get("address_line_2"));
  const town = trimOrNull(formData.get("town"));
  const post_code = trimOrNull(formData.get("post_code"));
  const emergency_first_name = trimOrNull(formData.get("emergency_first_name"));
  const emergency_last_name = trimOrNull(formData.get("emergency_last_name"));
  const emergency_relation = trimOrNull(formData.get("emergency_relation"));
  const emergency_contact = trimOrNull(formData.get("emergency_contact"));

  if (!first_name || !last_name || !email) {
    return { error: "First name, last name, and email are required." };
  }

  const result = await updateParent(parentId, {
    first_name,
    last_name,
    email,
    contact_number,
    session_rate,
    relationship,
    secondary_contact_number,
    address_line_1,
    address_line_2,
    town,
    post_code,
    emergency_first_name,
    emergency_last_name,
    emergency_relation,
    emergency_contact,
  });

  if ("error" in result) return { error: result.error };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/parents");
  revalidatePath(`/dashboard/parents/${parentId}`);
  revalidatePath("/dashboard/invoices");
  return {};
}
