import { renderToBuffer } from "@react-pdf/renderer";
import { getInvoiceById, getSessionsForInvoice } from "@/lib/db";
import { getInvoiceConfig } from "@/lib/invoice-config";
import { InvoicePDFDocument } from "@/lib/invoice-pdf";

function extractBillingMonthStart(billingMonth: string | Date | null): string | null {
  if (!billingMonth) return null;
  if (typeof billingMonth === "string") {
    const m = billingMonth.slice(0, 10).match(/^(\d{4})-(\d{2})/);
    return m ? `${m[1]}-${m[2]}-01` : billingMonth.slice(0, 10);
  }
  const d = new Date(billingMonth);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
  });
  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  return year && month ? `${year}-${month}-01` : null;
}

/**
 * Renders an invoice as a PDF buffer. Used for download and email attachment.
 */
export async function renderInvoicePdfBuffer(
  invoiceId: number
): Promise<Buffer | { error: string }> {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) return { error: "Invoice not found" };

  const billingMonth = extractBillingMonthStart(invoice.billing_month);
  if (!billingMonth) return { error: "Invoice has no billing month" };

  const sessions = await getSessionsForInvoice(invoice.parents_id, billingMonth);
  const rawConfig = getInvoiceConfig();

  let logoDataUri = "";
  if (rawConfig.logo_url?.trim()) {
    try {
      const res = await fetch(rawConfig.logo_url.trim(), { redirect: "follow" });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const base64 = buf.toString("base64");
        const contentType = res.headers.get("content-type") ?? "image/png";
        logoDataUri = `data:${contentType};base64,${base64}`;
      }
    } catch {
      // Skip logo
    }
  }

  const config = { ...rawConfig, logo_url: logoDataUri };

  const doc = InvoicePDFDocument({ invoice, sessions, config });
  const buffer = await renderToBuffer(doc);
  return buffer;
}
