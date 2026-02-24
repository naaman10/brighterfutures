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

export type SendTemplateOptions = {
  to: string;
  templateId: string;
  dynamicTemplateData: Record<string, string | number | boolean>;
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
