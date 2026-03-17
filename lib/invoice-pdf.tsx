import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Invoice } from "@/lib/db";
import type { SessionForInvoice } from "@/lib/db";

// react-pdf supports TTF/WOFF only; Google Fonts serves WOFF2 which causes
// "Offset is outside the bounds of the DataView". Use Helvetica (built-in).
// For National Park: add public/fonts/NationalPark-Regular.ttf and register.
import type { InvoiceConfig } from "@/lib/invoice-config";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#333",
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 8,
    color: "#666",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  table: {
    marginTop: 20,
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 6,
    marginBottom: 6,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  colDate: { width: "18%" },
  colTime: { width: "12%" },
  colStudent: { width: "28%" },
  colSubject: { width: "26%" },
  colAmount: { width: "16%", textAlign: "right" as const },
  totals: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "40%",
    marginBottom: 4,
  },
  totalLabel: {
    width: "50%",
    textAlign: "right",
    paddingRight: 12,
  },
  totalValue: {
    width: "50%",
    textAlign: "right",
    fontWeight: "bold",
  },
  grandTotal: {
    fontSize: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#000",
  },
  logo: {
    width: 80,
    height: 40,
    objectFit: "contain",
  },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
  },
  footerLabel: {
    fontSize: 8,
    color: "#666",
    marginBottom: 4,
  },
});

/**
 * Formats a date for display. For YYYY-MM-DD strings (e.g. session_date from DB),
 * parses as calendar date only so timezone never shifts the day (e.g. 2026-04-01
 * must show as 01/04/2026, not 31/03/2026).
 */
function formatDate(value: string | Date | null | undefined): string {
  if (value == null) return "—";
  const str = typeof value === "string" ? value.trim() : value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  const m = str.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const d = value instanceof Date ? value : new Date(str);
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function formatMonthYear(value: string | Date | null | undefined): string {
  if (value == null) return "—";
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(d);
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  const s = String(value).trim();
  if (/^\d{1,2}:\d{2}/.test(s)) return s.slice(0, 5);
  return s;
}

function formatCurrency(value: string | number | null | undefined): string {
  if (value == null || value === "") return "£0.00";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(n);
}

type InvoicePDFProps = {
  invoice: Invoice;
  sessions: SessionForInvoice[];
  config?: InvoiceConfig | null;
};

const DEFAULT_CONFIG: InvoiceConfig = {
  logo_url: "",
  billing_account_name: "",
  billing_account_number: "",
  billing_sort_code: "",
  terms: "",
};

export function InvoicePDFDocument({
  invoice,
  sessions,
  config: configProp,
}: InvoicePDFProps) {
  const config = configProp ?? DEFAULT_CONFIG;
  const hasBankDetails =
    !!config.billing_account_name?.trim() ||
    !!config.billing_account_number?.trim() ||
    !!config.billing_sort_code?.trim();
  const hasTerms = !!config.terms?.trim();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {config.logo_url?.trim() ? (
            <Image src={config.logo_url.trim()} style={styles.logo} />
          ) : null}
          <Text style={styles.title}>Invoice {invoice.invoice_number}</Text>
          <Text style={styles.subtitle}>Brighter Futures Tutoring</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.section}>
            <Text style={styles.label}>Bill to</Text>
            <Text style={styles.value}>{invoice.parent_name?.trim() || "—"}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Billing month</Text>
            <Text style={styles.value}>{formatMonthYear(invoice.billing_month)}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.section}>
            <Text style={styles.label}>Issued</Text>
            <Text style={styles.value}>{formatDate(invoice.issued_date)}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Due date</Text>
            <Text style={styles.value}>{formatDate(invoice.due_date)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colTime}>Time</Text>
            <Text style={styles.colStudent}>Student</Text>
            <Text style={styles.colSubject}>Subject</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>
          {sessions.map((s) => (
            <View key={s.id} style={styles.tableRow}>
              <Text style={styles.colDate}>{formatDate(s.session_date)}</Text>
              <Text style={styles.colTime}>{formatTime(s.session_time)}</Text>
              <Text style={styles.colStudent}>
                {s.student_first_name} {s.student_last_name}
              </Text>
              <Text style={styles.colSubject}>
                {s.status === "planned_reschedule"
                  ? `${s.subject || "—"} (Rescheduled)`
                  : s.subject || "—"}
              </Text>
              <Text style={styles.colAmount}>
                {s.status === "planned_reschedule"
                  ? "No charge"
                  : formatCurrency(s.session_rate)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.subtotal)}
            </Text>
          </View>
          {Number(invoice.discount_amount ?? 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount (amount)</Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(invoice.discount_amount)}
              </Text>
            </View>
          )}
          {Number(invoice.discount_pct ?? 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount ({invoice.discount_pct}%)</Text>
              <Text style={styles.totalValue}>
                -{formatCurrency((Number(invoice.subtotal) - Number(invoice.discount_amount ?? 0)) * (Number(invoice.discount_pct) / 100))}
              </Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.total)}
            </Text>
          </View>
        </View>

        {hasBankDetails ? (
          <View style={styles.footer}>
            <Text style={styles.footerLabel}>Payment details</Text>
            {config.billing_account_name?.trim() ? (
              <Text style={[styles.value, { marginBottom: 4 }]}>
                Account name: {config.billing_account_name.trim()}
              </Text>
            ) : null}
            {config.billing_sort_code?.trim() ? (
              <Text style={[styles.value, { marginBottom: 4 }]}>
                Sort code: {config.billing_sort_code.trim()}
              </Text>
            ) : null}
            {config.billing_account_number?.trim() ? (
              <Text style={styles.value}>
                Account number: {config.billing_account_number.trim()}
              </Text>
            ) : null}
          </View>
        ) : null}

        {hasTerms ? (
          <View style={styles.footer}>
            <Text style={styles.footerLabel}>Terms</Text>
            <Text style={styles.value}>{config.terms.trim()}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
