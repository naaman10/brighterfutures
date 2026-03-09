import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getInvoiceById, getSessionsForInvoice } from "@/lib/db";
import { getInvoiceConfig } from "@/lib/invoice-config";
import { InvoicePDFDocument } from "@/lib/invoice-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoiceId = parseInt(id, 10);
  if (Number.isNaN(invoiceId)) {
    return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
  }

  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Extract billing month start (YYYY-MM-01) in a timezone-safe way.
  // new Date(...).toISOString().slice(0,10) can return the previous calendar day
  // (e.g. April 1 00:00 BST = March 31 UTC), which would incorrectly include
  // March 31 sessions in the April invoice.
  let billingMonth: string | null = null;
  if (invoice.billing_month) {
    if (typeof invoice.billing_month === "string") {
      const m = invoice.billing_month.slice(0, 10).match(/^(\d{4})-(\d{2})/);
      billingMonth = m ? `${m[1]}-${m[2]}-01` : invoice.billing_month.slice(0, 10);
    } else {
      const d = new Date(invoice.billing_month);
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/London",
        year: "numeric",
        month: "2-digit",
      });
      const parts = formatter.formatToParts(d);
      const year = parts.find((p) => p.type === "year")?.value ?? "";
      const month = parts.find((p) => p.type === "month")?.value ?? "";
      billingMonth = year && month ? `${year}-${month}-01` : null;
    }
  }
  if (!billingMonth) {
    return NextResponse.json(
      { error: "Invoice has no billing month" },
      { status: 400 }
    );
  }

  const sessions = await getSessionsForInvoice(invoice.parents_id, billingMonth);
  const rawConfig = getInvoiceConfig();

  // Fetch logo as base64 to avoid Image component fetch/CORS issues
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
      // Skip logo if fetch fails
    }
  }

  const config = {
    ...rawConfig,
    logo_url: logoDataUri,
  };

  try {
    const doc = InvoicePDFDocument({ invoice, sessions, config });
    const buffer = await renderToBuffer(doc);

    const filename = `invoice-${invoice.invoice_number}.pdf`;
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "PDF generation failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
