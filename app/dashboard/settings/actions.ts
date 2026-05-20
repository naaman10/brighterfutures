"use server";

import { revalidatePath } from "next/cache";
import {
  backfillSessionsToGoogle,
  verifyGoogleCalendarAccess,
} from "@/lib/google-calendar";

export async function verifyGoogleCalendarAction(): Promise<
  { ok: true } | { error: string }
> {
  return verifyGoogleCalendarAccess();
}

export async function backfillGoogleCalendarAction(): Promise<{
  synced: number;
  skipped: number;
  errors: string[];
  error?: string;
}> {
  const verify = await verifyGoogleCalendarAccess();
  if ("error" in verify) {
    return { synced: 0, skipped: 0, errors: [], error: verify.error };
  }

  const result = await backfillSessionsToGoogle();
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return result;
}
