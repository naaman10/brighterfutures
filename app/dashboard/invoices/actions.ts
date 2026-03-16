"use server";

import { revalidatePath } from "next/cache";
import {
  createInvoice,
  deleteInvoices,
  getInvoiceById,
  getSessionsByParentForMonth,
  getSessionsByParentForNextMonth,
  hasInvoiceForParentAndMonth,
  updateInvoiceStatus,
} from "@/lib/db";
import { renderInvoicePdfBuffer } from "@/lib/invoice-pdf-buffer";
import { sendTemplate } from "@/lib/email";

/**
 * Returns the first day of next calendar month as YYYY-MM-DD.
 */
function getNextMonthStart(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

/**
 * Due date is the 1st of the billing month (YYYY-MM-DD).
 */
function getDueDate(billingMonthStart: string): string {
  return billingMonthStart.slice(0, 10);
}

export async function generateInvoices(): Promise<{
  ok?: boolean;
  error?: string;
  created?: number;
  message?: string;
}> {
  try {
    const parentsWithSessions = await getSessionsByParentForNextMonth();
    if (parentsWithSessions.length === 0) {
      return {
        ok: false,
        error: "No parents have billable sessions for next month.",
        message:
          "Sessions must be in the next calendar month and not have status 'Planned reschedule'.",
      };
    }

    const billingMonth = getNextMonthStart();
    const issuedDate = new Date().toISOString().slice(0, 10);
    const dueDate = getDueDate(billingMonth);
    let created = 0;

    for (const row of parentsWithSessions) {
      const rate = row.session_rate != null ? Number(row.session_rate) : null;
      if (rate == null || Number.isNaN(rate)) {
        return {
          ok: false,
          error: `Parent ${row.parent_first_name ?? ""} ${row.parent_last_name ?? ""} has no session_rate set. Add a session_rate (£) to the parent.`,
          created,
        };
      }
      const subtotal = row.session_count * rate;
      const result = await createInvoice({
        parents_id: row.parents_id,
        billing_month: billingMonth,
        issued_date: issuedDate,
        due_date: dueDate,
        subtotal,
      });
      if ("ok" in result && result.ok) {
        created++;
      } else {
        return {
          ok: false,
          error: "error" in result ? result.error : "Failed to create invoice",
          created,
        };
      }
    }

    revalidatePath("/dashboard/invoices");
    return {
      ok: true,
      created,
      message: `Generated ${created} invoice${created === 1 ? "" : "s"} for ${billingMonth}.`,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to generate invoices.";
    return { ok: false, error: message };
  }
}

/**
 * Generate a single invoice for a given parent and billing month (YYYY-MM-DD, first day of month).
 */
export async function generateInvoiceForParentAndMonth(
  parentId: string,
  billingMonth: string
): Promise<{ ok?: boolean; error?: string; message?: string }> {
  const monthStart = billingMonth.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(monthStart)) {
    return { ok: false, error: "Invalid billing month." };
  }

  const existing = await hasInvoiceForParentAndMonth(parentId, monthStart);
  if (existing) {
    return {
      ok: false,
      error: "An invoice already exists for this parent and month.",
    };
  }

  const row = await getSessionsByParentForMonth(parentId, monthStart);
  if (!row || row.session_count === 0) {
    return {
      ok: false,
      error:
        "No billable sessions for this parent in the selected month (or only 'Planned reschedule' sessions).",
    };
  }

  const rate = row.session_rate != null ? Number(row.session_rate) : null;
  if (rate == null || Number.isNaN(rate)) {
    return {
      ok: false,
      error: "Parent has no session rate set. Add a session rate (£) to the parent.",
    };
  }

  const issuedDate = new Date().toISOString().slice(0, 10);
  const dueDate = getDueDate(monthStart);
  const subtotal = row.session_count * rate;

  const result = await createInvoice({
    parents_id: parentId,
    billing_month: monthStart,
    issued_date: issuedDate,
    due_date: dueDate,
    subtotal,
  });

  if ("error" in result) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/dashboard/invoices");
  return {
    ok: true,
    message: `Invoice ${result.invoice_number} created for ${monthStart}.`,
  };
}

const INVOICE_EMAIL_TEMPLATE_ID = "d-0b61465b24144177bb2cd4f23a0bcb33";

function formatInvoiceMonth(billingMonth: string | Date | null): string {
  if (!billingMonth) return "";
  const d = typeof billingMonth === "string" ? new Date(billingMonth.slice(0, 10) + "T12:00:00Z") : new Date(billingMonth);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(d);
}

export async function sendSelectedInvoices(invoiceIds: number[]): Promise<{
  ok?: boolean;
  sent?: number;
  error?: string;
}> {
  if (invoiceIds.length === 0) {
    return { ok: false, error: "No invoices selected." };
  }

  let sent = 0;

  for (const invoiceId of invoiceIds) {
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      return { ok: false, sent, error: `Invoice ${invoiceId} not found.` };
    }

    const email = invoice.parent_email?.trim();
    if (!email) {
      return { ok: false, sent, error: `Parent for invoice ${invoice.invoice_number} has no email address.` };
    }

    const pdfResult = await renderInvoicePdfBuffer(invoiceId);
    if ("error" in pdfResult) {
      return { ok: false, sent, error: `Failed to generate PDF for ${invoice.invoice_number}: ${pdfResult.error}` };
    }

    const templateResult = await sendTemplate({
      to: email,
      templateId: INVOICE_EMAIL_TEMPLATE_ID,
      dynamicTemplateData: {
        parent_name: invoice.parent_first_name?.trim() ?? invoice.parent_name?.split(" ")[0] ?? "Parent",
        invoice_month: formatInvoiceMonth(invoice.billing_month),
      },
      attachments: [
        {
          content: pdfResult.toString("base64"),
          filename: `invoice-${invoice.invoice_number}.pdf`,
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    });

    if (!templateResult.success) {
      return { ok: false, sent, error: `Failed to send ${invoice.invoice_number}: ${templateResult.error}` };
    }

    const updateResult = await updateInvoiceStatus(invoiceId, "issued");
    if ("ok" in updateResult && updateResult.ok) {
      sent++;
    } else {
      return {
        ok: false,
        sent,
        error: "error" in updateResult
          ? `Invoice sent but status update failed: ${updateResult.error}`
          : "Invoice sent but status update failed.",
      };
    }
  }

  revalidatePath("/dashboard/invoices");
  return { ok: true, sent };
}

export async function markSelectedInvoicesAsPaid(invoiceIds: number[]): Promise<{
  ok?: boolean;
  updated?: number;
  error?: string;
}> {
  if (invoiceIds.length === 0) {
    return { ok: false, error: "No invoices selected." };
  }

  let updated = 0;
  for (const invoiceId of invoiceIds) {
    const result = await updateInvoiceStatus(invoiceId, "paid");
    if ("ok" in result && result.ok) {
      updated++;
    } else {
      return {
        ok: false,
        updated,
        error: "error" in result ? result.error : "Failed to update invoice status.",
      };
    }
  }

  revalidatePath("/dashboard/invoices");
  return { ok: true, updated };
}

export async function deleteSelectedInvoices(invoiceIds: number[]): Promise<{
  ok?: boolean;
  deleted?: number;
  error?: string;
}> {
  if (invoiceIds.length === 0) {
    return { ok: false, error: "No invoices selected." };
  }
  const result = await deleteInvoices(invoiceIds);
  if ("error" in result) {
    return { ok: false, error: result.error };
  }
  revalidatePath("/dashboard/invoices");
  return { ok: true, deleted: result.deleted };
}
