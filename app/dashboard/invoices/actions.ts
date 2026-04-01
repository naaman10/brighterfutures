"use server";

import { revalidatePath } from "next/cache";
import {
  createInvoice,
  deleteInvoices,
  getInvoiceById,
  getInvoiceByParentAndMonth,
  getSessionsByParentForMonth,
  getSessionsByParentForNextMonth,
  updateInvoice,
  updateInvoiceDiscount,
  updateInvoiceStatus,
} from "@/lib/db";
import { renderInvoicePdfBuffer } from "@/lib/invoice-pdf-buffer";
import { sendTemplate } from "@/lib/email";

/**
 * Returns the first day of next calendar month as YYYY-MM-DD.
 * Uses local date components so the result is not shifted by UTC (toISOString would
 * otherwise include sessions from the previous month on the "next month" invoice).
 */
function getNextMonthStart(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-11
  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear += 1;
  }
  const monthStr = String(nextMonth + 1).padStart(2, "0");
  return `${nextYear}-${monthStr}-01`;
}

/**
 * Due date is the 1st of the billing month (YYYY-MM-DD).
 */
function getDueDate(billingMonthStart: string): string {
  return billingMonthStart.slice(0, 10);
}

const LOCKED_STATUSES = ["issued", "paid"] as const;

export async function generateInvoices(): Promise<{
  ok?: boolean;
  error?: string;
  created?: number;
  updated?: number;
  message?: string;
}> {
  try {
    const billingMonth = getNextMonthStart();
    const parentsWithSessions = await getSessionsByParentForNextMonth(billingMonth);
    if (parentsWithSessions.length === 0) {
      return {
        ok: false,
        error: "No parents have billable sessions for next month.",
        message:
          "Sessions must be in the next calendar month and not have status 'Planned reschedule'.",
        created: 0,
        updated: 0,
      };
    }

    const issuedDate = new Date().toISOString().slice(0, 10);
    const dueDate = getDueDate(billingMonth);
    let created = 0;
    let updated = 0;

    for (const row of parentsWithSessions) {
      const rate = row.session_rate != null ? Number(row.session_rate) : null;
      if (rate == null || Number.isNaN(rate)) {
        return {
          ok: false,
          error: `Parent ${row.parent_first_name ?? ""} ${row.parent_last_name ?? ""} has no session_rate set. Add a session_rate (£) to the parent.`,
          created,
          updated,
        };
      }

      const existing = await getInvoiceByParentAndMonth(row.parents_id, billingMonth);
      if (existing) {
        if (LOCKED_STATUSES.includes(existing.status as (typeof LOCKED_STATUSES)[number])) {
          continue;
        }
        const sessionRow = await getSessionsByParentForMonth(row.parents_id, billingMonth);
        const newSubtotal = sessionRow ? sessionRow.session_count * rate : 0;
        const updateResult = await updateInvoice(existing.id, {
          subtotal: newSubtotal,
          issued_date: issuedDate,
        });
        if ("ok" in updateResult && updateResult.ok) {
          updated++;
        } else {
          return {
            ok: false,
            error: "error" in updateResult ? updateResult.error : "Failed to update invoice",
            created,
            updated,
          };
        }
      } else {
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
            updated,
          };
        }
      }
    }

    revalidatePath("/dashboard/invoices");
    const parts: string[] = [];
    if (created > 0) parts.push(`${created} created`);
    if (updated > 0) parts.push(`${updated} updated`);
    const message =
      parts.length > 0
        ? `${parts.join(", ")} for ${billingMonth}.`
        : `No new or draft invoices to generate for ${billingMonth}.`;
    return {
      ok: true,
      created,
      updated,
      message,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to generate invoices.";
    return { ok: false, error: message };
  }
}

/**
 * Generate a single invoice for a given parent and billing month (YYYY-MM-DD, first day of month).
 * If an invoice already exists: updates it when draft, errors when issued/paid.
 */
export async function generateInvoiceForParentAndMonth(
  parentId: string,
  billingMonth: string,
  options?: { discount_amount?: number; discount_pct?: number }
): Promise<{ ok?: boolean; error?: string; message?: string }> {
  const monthStart = billingMonth.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(monthStart)) {
    return { ok: false, error: "Invalid billing month." };
  }

  const existing = await getInvoiceByParentAndMonth(parentId, monthStart);
  if (existing && LOCKED_STATUSES.includes(existing.status as (typeof LOCKED_STATUSES)[number])) {
    return {
      ok: false,
      error: "An issued or paid invoice already exists for this parent and month. Cancel it first to create a new one.",
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

  if (existing) {
    const updateResult = await updateInvoice(existing.id, {
      subtotal,
      issued_date: issuedDate,
    });
    if ("error" in updateResult) {
      return { ok: false, error: updateResult.error };
    }
    revalidatePath("/dashboard/invoices");
    return {
      ok: true,
      message: `Invoice ${existing.invoice_number} updated for ${monthStart}.`,
    };
  }

  const result = await createInvoice({
    parents_id: parentId,
    billing_month: monthStart,
    issued_date: issuedDate,
    due_date: dueDate,
    subtotal,
    discount_amount: options?.discount_amount,
    discount_pct: options?.discount_pct,
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

function formatInvoiceMonthName(billingMonth: string | Date | null): string {
  if (!billingMonth) return "";
  const d =
    typeof billingMonth === "string"
      ? new Date(billingMonth.slice(0, 10) + "T12:00:00Z")
      : new Date(billingMonth);
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "Europe/London",
  }).format(d);
}

const PAYMENT_REMINDER_TEMPLATE_ID = "d-81d93a6ccb88442eb76b2bacad30aabd";

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

/**
 * Sends a payment reminder email for selected invoices, but only for invoices
 * whose status is exactly "issued".
 *
 * Sends at most one email per (parents_id, invoice_month).
 */
export async function sendPaymentReminders(invoiceIds: number[]): Promise<{
  ok?: boolean;
  sent?: number;
  skipped?: number;
  error?: string;
}> {
  if (invoiceIds.length === 0) {
    return { ok: false, error: "No invoices selected." };
  }

  const sentKeys = new Set<string>();
  let sent = 0;
  let skipped = 0;

  for (const invoiceId of invoiceIds) {
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      return { ok: false, sent, skipped, error: `Invoice ${invoiceId} not found.` };
    }

    if (invoice.status !== "issued") {
      skipped++;
      continue;
    }

    const email = invoice.parent_email?.trim();
    if (!email) {
      skipped++;
      continue;
    }

    const parentFirstName =
      invoice.parent_first_name?.trim() ??
      invoice.parent_name?.split(" ")[0]?.trim() ??
      "Parent";

    const invoiceMonth = formatInvoiceMonthName(invoice.billing_month);
    const key = `${invoice.parents_id}|${invoiceMonth}`;
    if (sentKeys.has(key)) continue;
    sentKeys.add(key);

    const templateResult = await sendTemplate({
      to: email,
      templateId: PAYMENT_REMINDER_TEMPLATE_ID,
      dynamicTemplateData: {
        parent_name: parentFirstName,
        invoice_month: invoiceMonth,
      },
    });

    if (!templateResult.success) {
      return {
        ok: false,
        sent,
        skipped,
        error: `Failed to send payment reminder: ${templateResult.error}`,
      };
    }

    sent++;
  }

  revalidatePath("/dashboard/invoices");
  return { ok: true, sent, skipped };
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

export async function regenerateSelectedInvoices(invoiceIds: number[]): Promise<{
  ok?: boolean;
  regenerated?: number;
  skipped?: number;
  errors?: string[];
}> {
  if (invoiceIds.length === 0) {
    return { ok: false, errors: ["No invoices selected."] };
  }
  let regenerated = 0;
  const errors: string[] = [];

  for (const id of invoiceIds) {
    const invoice = await getInvoiceById(id);
    if (!invoice) {
      errors.push(`Invoice ${id} not found.`);
      continue;
    }
    if (LOCKED_STATUSES.includes(invoice.status as (typeof LOCKED_STATUSES)[number])) {
      errors.push(`Invoice ${invoice.invoice_number} is ${invoice.status} and cannot be regenerated.`);
      continue;
    }
    const parentId = invoice.parents_id;
    const billingMonth =
      typeof invoice.billing_month === "string"
        ? invoice.billing_month.slice(0, 10)
        : invoice.billing_month
          ? new Date(invoice.billing_month).toISOString().slice(0, 10)
          : null;
    if (!billingMonth) {
      errors.push(`Invoice ${invoice.invoice_number} has no billing month.`);
      continue;
    }
    const row = await getSessionsByParentForMonth(parentId, billingMonth);
    if (!row) {
      errors.push(`No sessions found for invoice ${invoice.invoice_number}.`);
      continue;
    }
    const rate = row.session_rate != null ? Number(row.session_rate) : null;
    if (rate == null || Number.isNaN(rate)) {
      errors.push(`Parent has no session rate for invoice ${invoice.invoice_number}.`);
      continue;
    }
    const subtotal = row.session_count * rate;
    const result = await updateInvoice(id, { subtotal });
    if ("ok" in result && result.ok) {
      regenerated++;
    } else {
      errors.push("error" in result ? result.error ?? "Update failed" : "Update failed");
    }
  }

  revalidatePath("/dashboard/invoices");
  const skipped = invoiceIds.length - regenerated - errors.length;
  return {
    ok: errors.length === 0 || regenerated > 0,
    regenerated,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export async function cancelSelectedInvoices(invoiceIds: number[]): Promise<{
  ok?: boolean;
  cancelled?: number;
  error?: string;
}> {
  if (invoiceIds.length === 0) {
    return { ok: false, error: "No invoices selected." };
  }
  let cancelled = 0;
  for (const id of invoiceIds) {
    const result = await updateInvoiceStatus(id, "cancelled");
    if ("ok" in result && result.ok) {
      cancelled++;
    } else {
      return {
        ok: false,
        cancelled,
        error: "error" in result ? result.error : "Failed to cancel invoice.",
      };
    }
  }
  revalidatePath("/dashboard/invoices");
  return { ok: true, cancelled };
}

export async function updateInvoiceDiscountAction(
  invoiceId: number,
  discount_amount: number | null,
  discount_pct: number | null
): Promise<{ ok?: boolean; error?: string }> {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) {
    return { ok: false, error: "Invoice not found." };
  }
  if (invoice.status !== "draft") {
    return {
      ok: false,
      error: "Discount can only be added or edited on draft invoices.",
    };
  }
  const result = await updateInvoiceDiscount(invoiceId, {
    discount_amount: discount_amount ?? 0,
    discount_pct: discount_pct ?? 0,
  });
  if ("error" in result) {
    return { ok: false, error: result.error };
  }
  revalidatePath("/dashboard/invoices");
  return { ok: true };
}
