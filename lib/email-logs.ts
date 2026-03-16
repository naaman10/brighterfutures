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

const ACTIVITY_API_KEY =
  process.env.SENDGRID_ACTIVITY_API_KEY ?? process.env.SENDGRID_API_KEY ?? "";

const ACTIVITY_BASE_URL =
  process.env.SENDGRID_ACTIVITY_BASE_URL ??
  // Default to Messages API which is available on many plans.
  "https://api.sendgrid.com/v3/messages";

/**
 * Fetches recent email logs from SendGrid's Email Activity / Messages API.
 * This is a read-only helper and does not write anything to our database.
 */
export async function getEmailLogs(
  filters: EmailLogFilters = {}
): Promise<EmailLogResult> {
  if (!ACTIVITY_API_KEY) {
    return {
      ok: false,
      error:
        "Email logs are unavailable. SENDGRID_ACTIVITY_API_KEY (or SENDGRID_API_KEY) is not set.",
    };
  }

  const limit = filters.limit && filters.limit > 0 && filters.limit <= 100 ? filters.limit : 50;

  const url = new URL(ACTIVITY_BASE_URL);
  url.searchParams.set("limit", String(limit));

  // If the Activity API for your account supports additional filters (query, from, to),
  // you can extend this to pass them through. For now we fetch a recent page and
  // optionally filter in memory by "to" using filters.query.

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${ACTIVITY_API_KEY}`,
        Accept: "application/json",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to contact SendGrid Activity API.";
    return { ok: false, error: message };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: `SendGrid Activity API returned ${res.status} ${res.statusText}`,
    };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: "Failed to parse SendGrid Activity API response." };
  }

  // Messages API typically returns { messages: [...] }
  const messages = Array.isArray((data as any)?.messages)
    ? ((data as any).messages as any[])
    : Array.isArray(data)
      ? (data as any[])
      : [];

  const logs: EmailLogEntry[] = messages.map((m) => {
    // Shape may vary by plan / API; we normalise defensively.
    const to =
      (m.to_email as string) ??
      (Array.isArray(m.to_emails) ? (m.to_emails[0] as string) : "") ??
      "";
    const subject = (m.subject as string | undefined) ?? (m.subjects?.[0] as string | undefined);
    const templateId =
      (m.template_id as string | undefined) ??
      (Array.isArray(m.templates) ? (m.templates[0]?.id as string | undefined) : undefined);
    const status = (m.status as string | undefined) ?? (m.event as string | undefined) ?? "unknown";
    const event = (m.event as string | undefined) ?? status;
    const timestampRaw =
      (m.last_event_time as string | undefined) ??
      (m.timestamp as string | number | undefined) ??
      (m.created as string | number | undefined);
    const timestamp =
      typeof timestampRaw === "number"
        ? new Date(timestampRaw * 1000).toISOString()
        : typeof timestampRaw === "string"
          ? new Date(timestampRaw).toISOString()
          : new Date().toISOString();

    return {
      id:
        (m.msg_id as string | undefined) ??
        (m.sg_message_id as string | undefined) ??
        (m.message_id as string | undefined) ??
        `${to}-${timestamp}`,
      to,
      subject,
      templateId,
      status,
      event,
      timestamp,
    };
  });

  const query = filters.query?.trim().toLowerCase();
  const filtered = query
    ? logs.filter((l) => l.to.toLowerCase().includes(query))
    : logs;

  return { ok: true, logs: filtered };
}

