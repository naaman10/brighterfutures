import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@example.com";

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
 * Sends an email via Resend.
 * Requires RESEND_API_KEY in env. Optionally set RESEND_FROM_EMAIL.
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: SendEmailOptions): Promise<{ success: true } | { success: false; error: string }> {
  if (!apiKey || !resend) {
    return {
      success: false,
      error: "RESEND_API_KEY is not set",
    };
  }

  try {
    const payload: any = {
      from: fromEmail,
      to,
      subject,
    };

    if (html) {
      payload.html = html;
    }
    if (text) {
      payload.text = text;
    }

    await resend.emails.send(payload);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Resend request failed";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Sends an email via Resend using a template from your Resend dashboard.
 * Requires RESEND_API_KEY and RESEND_FROM_EMAIL in env.
 * References templates by name (e.g., "welcome-email").
 */
export async function sendTemplate({
  to,
  templateId,
  dynamicTemplateData,
  attachments,
}: SendTemplateOptions): Promise<{ success: true } | { success: false; error: string }> {
  if (!apiKey || !resend) {
    return {
      success: false,
      error: "RESEND_API_KEY is not set",
    };
  }

  try {
    const resendAttachments = attachments?.map((att) => ({
      filename: att.filename,
      content: Buffer.from(att.content, "base64"),
    }));

    const payload: any = {
      from: fromEmail,
      to,
      template: {
        id: templateId,
        variables: dynamicTemplateData,
      },
    };

    if (resendAttachments && resendAttachments.length > 0) {
      payload.attachments = resendAttachments;
    }

    console.log("[Resend] Attempting to send email with payload:", {
      from: payload.from,
      to: payload.to,
      template: payload.template,
      hasAttachments: !!payload.attachments,
      templateDataKeys: Object.keys(dynamicTemplateData),
    });

    const result = await resend.emails.send(payload);
    
    console.log("[Resend] Email send result:", result);
    
    return { success: true };
  } catch (err: unknown) {
    console.error("[Resend] Error sending email:", err);
    const message = err instanceof Error ? err.message : "Resend request failed";
    const errorDetails = err && typeof err === "object" ? JSON.stringify(err, null, 2) : message;
    return {
      success: false,
      error: `${message}\nDetails: ${errorDetails}`,
    };
  }
}
