import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? "noreply@example.com";

export type SendEmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type SendTemplateAttachment = {
  content: string;
  filename: string;
  type: string;
  disposition?: "attachment" | "inline";
};

const WELCOME_EMAIL_ATTACHMENTS: { url: string; filename: string }[] = [
  { url: "https://res.cloudinary.com/njh101010/raw/upload/v1772834069/brighterfutures/documents/Parent_Form.docx", filename: "Parent_Form.docx" },
  { url: "https://res.cloudinary.com/njh101010/raw/upload/v1772834069/brighterfutures/documents/Terms_and_conditions_2026.docx", filename: "Terms_and_conditions_2026.docx" },
  { url: "https://res.cloudinary.com/njh101010/raw/upload/v1772834069/brighterfutures/documents/Extra_Materials_for_pupils.docx", filename: "Extra_Materials_for_pupils.docx" },
];

async function fetchAttachment(url: string, filename: string): Promise<SendTemplateAttachment> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    content: buffer.toString("base64"),
    filename,
    type: DOCX_MIME,
    disposition: "attachment",
  };
}

/** Fetches all welcome email attachments from Cloudinary. */
export async function getWelcomeEmailAttachments(): Promise<SendTemplateAttachment[]> {
  return Promise.all(
    WELCOME_EMAIL_ATTACHMENTS.map(({ url, filename }) => fetchAttachment(url, filename))
  );
}

export type SendTemplateOptions = {
  to: string;
  templateId: string;
  dynamicTemplateData: Record<string, string | number | boolean>;
  attachments?: SendTemplateAttachment[];
};

/**
 * Sends an email via SendGrid.
 * Requires SENDGRID_API_KEY in env. Optionally set SENDGRID_FROM_EMAIL.
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: SendEmailOptions): Promise<{ success: true } | { success: false; error: string }> {
  if (!apiKey) {
    return {
      success: false,
      error: "SENDGRID_API_KEY is not set",
    };
  }

  try {
    await sgMail.send({
      to,
      from: fromEmail,
      subject,
      text: text ?? html?.replace(/<[^>]*>/g, "") ?? "",
      html: html ?? undefined,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "SendGrid request failed";
    const response = err && typeof err === "object" && "response" in err
      ? (err as { response?: { statusCode?: number; body?: unknown } }).response
      : undefined;
    if (response?.statusCode === 403) {
      return {
        success: false,
        error: `SendGrid 403 Forbidden. Verify your sender email (${fromEmail}) at https://app.sendgrid.com/settings/sender_auth/senders — add and verify a Single Sender, then set SENDGRID_FROM_EMAIL to that address.`,
      };
    }
    const body = response?.body;
    const detail = body && typeof body === "object" && "errors" in body
      ? (body as { errors?: unknown }).errors
      : message;
    return {
      success: false,
      error: typeof detail === "string" ? detail : JSON.stringify(detail ?? message),
    };
  }
}

/**
 * Sends an email via a SendGrid dynamic template.
 * Requires SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in env.
 */
export async function sendTemplate({
  to,
  templateId,
  dynamicTemplateData,
  attachments,
}: SendTemplateOptions): Promise<{ success: true } | { success: false; error: string }> {
  if (!apiKey) {
    return {
      success: false,
      error: "SENDGRID_API_KEY is not set",
    };
  }

  try {
    await sgMail.send({
      to,
      from: fromEmail,
      templateId,
      dynamicTemplateData,
      attachments: attachments?.length ? attachments : undefined,
    });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "SendGrid request failed";
    const response = err && typeof err === "object" && "response" in err
      ? (err as { response?: { statusCode?: number; body?: unknown } }).response
      : undefined;
    if (response?.statusCode === 403) {
      return {
        success: false,
        error: `SendGrid 403 Forbidden. Verify your sender email (${fromEmail}) at https://app.sendgrid.com/settings/sender_auth/senders — add and verify a Single Sender, then set SENDGRID_FROM_EMAIL to that address.`,
      };
    }
    const body = response?.body;
    const detail = body && typeof body === "object" && "errors" in body
      ? (body as { errors?: unknown }).errors
      : message;
    return {
      success: false,
      error: typeof detail === "string" ? detail : JSON.stringify(detail ?? message),
    };
  }
}
