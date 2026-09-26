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
    const payload: {
      from: string;
      to: string;
      subject: string;
      html?: string;
      text?: string;
    } = {
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
 * Sends an email via Resend using HTML template.
 * Requires RESEND_API_KEY and RESEND_FROM_EMAIL in env.
 * Note: Resend uses React components for templates. This function generates HTML
 * from the template data for now. For production, consider creating React email templates.
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

    let html = "";
    let subject = "";

    if (templateId === "welcome-email") {
      subject = "Welcome to Brighter Futures Tuition";
      html = generateWelcomeEmailHtml(dynamicTemplateData);
    } else {
      return {
        success: false,
        error: `Unknown template: ${templateId}`,
      };
    }

    const payload: {
      from: string;
      to: string;
      subject: string;
      html: string;
      attachments?: Array<{ filename: string; content: Buffer }>;
    } = {
      from: fromEmail,
      to,
      subject,
      html,
    };

    if (resendAttachments && resendAttachments.length > 0) {
      payload.attachments = resendAttachments;
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

function generateWelcomeEmailHtml(data: Record<string, string | number | boolean>): string {
  const parentName = String(data.parent_name || "");
  const childName = String(data.child_name || "");
  const startDate = String(data.start_date || "");
  const startTime = String(data.start_time || "");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Brighter Futures Tuition</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
    <h1 style="color: #2563eb; margin-top: 0;">Welcome to Brighter Futures Tuition!</h1>
    
    <p>Dear ${parentName},</p>
    
    <p>Thank you for choosing Brighter Futures Tuition for ${childName}'s educational journey. We're excited to support their learning and development!</p>
    
    <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
      <h2 style="margin-top: 0; color: #1e40af; font-size: 18px;">First Session Details</h2>
      <p style="margin: 10px 0;"><strong>Student:</strong> ${childName}</p>
      <p style="margin: 10px 0;"><strong>Date:</strong> ${startDate}</p>
      <p style="margin: 10px 0;"><strong>Time:</strong> ${startTime}</p>
    </div>
    
    <p>Please find attached the terms and conditions, as well as extra materials for pupils.</p>
    
    <p>If you have any questions or need to reschedule, please don't hesitate to contact us.</p>
    
    <p>We look forward to working with ${childName}!</p>
    
    <p style="margin-top: 30px;">Best regards,<br>
    <strong>The Brighter Futures Tuition Team</strong></p>
  </div>
  
  <div style="margin-top: 20px; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
    <p>This email was sent by Brighter Futures Tuition</p>
  </div>
</body>
</html>
  `.trim();
}
