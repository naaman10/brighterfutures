"use server";

import { revalidatePath } from "next/cache";
import { sendTemplate } from "@/lib/email";
import { getLeadById, updateLeadStatusById, type LeadStatus } from "@/lib/db";

const VALID_STATUSES: LeadStatus[] = ["new", "in_progress", "closed"];

const LEAD_ONBOARDING_TEMPLATE_ID = "d-ecb07c503ac942cca3bc3a245ef7c859";

function isLeadInProgressStatus(value: unknown): boolean {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw === "in progress" || raw === "in_progress" || raw === "inprogress";
}

function leadFirstNameForTemplate(lead: Record<string, unknown>): string {
  const first = String(lead.first_name ?? "").trim();
  if (first) return first;
  const full = String(lead.full_name ?? "").trim();
  if (full) return full.split(/\s+/)[0] ?? full;
  const name = String(lead.name ?? "").trim();
  if (name) return name.split(/\s+/)[0] ?? name;
  return "";
}

export async function updateLeadStatusAction(
  leadId: string,
  status: LeadStatus
): Promise<{ error?: string }> {
  if (!leadId?.trim()) return { error: "Lead id is required." };
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status." };

  const result = await updateLeadStatusById(leadId, status);
  if ("error" in result) return { error: result.error };

  revalidatePath("/dashboard/leads");
  return {};
}

/**
 * Sends the lead onboarding SendGrid template to the lead's email.
 * Only allowed when the lead's status is In Progress.
 */
export async function sendLeadOnboardingAction(leadId: string): Promise<{ error?: string }> {
  if (!leadId?.trim()) return { error: "Lead id is required." };

  const lead = await getLeadById(leadId);
  if (!lead) return { error: "Lead not found." };

  if (!isLeadInProgressStatus(lead.status)) {
    return { error: "Onboarding email can only be sent for leads in In Progress." };
  }

  const to = String(lead.contact_email ?? "").trim();
  if (!to) return { error: "Lead must have a contact email address." };

  const parentName = leadFirstNameForTemplate(lead);
  if (!parentName) return { error: "Lead must have a first name (or name) for the email." };

  const result = await sendTemplate({
    to,
    templateId: LEAD_ONBOARDING_TEMPLATE_ID,
    dynamicTemplateData: {
      parent_name: parentName,
    },
  });

  if (!result.success) return { error: result.error };

  revalidatePath("/dashboard/leads");
  return {};
}

