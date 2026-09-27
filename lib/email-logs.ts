import { Resend } from "resend";

export type EmailLogEntry = {
  id: string;
  to: string;
  subject?: string;
  templateId?: string;
  status: string;
  event: string;
  timestamp: string;
};

export type EmailLogFilters = {
  limit?: number;
  query?: string;
  from?: Date;
  to?: Date;
};

export type EmailLogResult =
  | { ok: true; logs: EmailLogEntry[] }
  | { ok: false; error: string };

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

/**
 * Fetches recent email logs from Resend's Emails API.
 * This is a read-only helper and does not write anything to our database.
 */
export async function getEmailLogs(
  filters: EmailLogFilters = {}
): Promise<EmailLogResult> {
  if (!apiKey || !resend) {
    return {
      ok: false,
      error: "Email logs are unavailable. RESEND_API_KEY is not set.",
    };
  }

  const limit = filters.limit && filters.limit > 0 && filters.limit <= 100 ? filters.limit : 50;

  try {
    const response = await resend.emails.list({ limit });

    if (!response.data || !response.data.data) {
      return {
        ok: false,
        error: "No data returned from Resend API",
      };
    }

    const emails = response.data.data;
    
    const logs: EmailLogEntry[] = emails.map((email: any) => {
      const to = Array.isArray(email.to) ? email.to[0] : email.to || "";
      const subject = email.subject || "";
      
      // Extract template ID if it was a template email
      const templateId = email.template?.id || undefined;
      
      // Map Resend status to our format
      const status = email.last_event || "sent";
      const event = email.last_event || "sent";
      
      const timestamp = email.created_at 
        ? new Date(email.created_at).toISOString()
        : new Date().toISOString();

      return {
        id: email.id,
        to,
        subject,
        templateId,
        status,
        event,
        timestamp,
      };
    });

    // Filter by recipient email if query provided
    const query = filters.query?.trim().toLowerCase();
    const filtered = query
      ? logs.filter((l) => l.to.toLowerCase().includes(query))
      : logs;

    return { ok: true, logs: filtered };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch Resend email logs";
    return { ok: false, error: message };
  }
}

