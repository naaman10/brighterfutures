import { NextResponse } from "next/server";
import { createLeadFromContact } from "@/lib/db";

export const runtime = "nodejs";

const GENERIC_ERROR =
  "We could not save your message right now. Please try again later.";

function corsHeaders(origin: string | null): HeadersInit {
  const allowOrigin = origin ?? "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

async function parseBody(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get("content-type") ?? "";

  if (ct.includes("application/json")) {
    const raw = (await req.json()) as unknown;
    if (!raw || typeof raw !== "object") return {};
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).map(([k, v]) => [
        k,
        v == null ? "" : String(v),
      ])
    );
  }

  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const out: Record<string, string> = {};
    form.forEach((v, k) => {
      out[k] = typeof v === "string" ? v : "";
    });
    return out;
  }

  try {
    const text = await req.text();
    if (!text.trim()) return {};
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => [k, v == null ? "" : String(v)])
    );
  } catch {
    return {};
  }
}

function pickEmail(fields: Record<string, string>): string {
  return (
    fields.contact_email?.trim() ||
    fields.email?.trim() ||
    fields.Email?.trim() ||
    fields["contact-email"]?.trim() ||
    ""
  );
}

function pickMessage(fields: Record<string, string>): string | null {
  const m =
    fields.message?.trim() ||
    fields.body?.trim() ||
    fields.comments?.trim() ||
    fields.enquiry?.trim() ||
    "";
  return m || null;
}

function pickNames(fields: Record<string, string>): { first: string; last: string | null } {
  let first = fields.first_name?.trim() || fields.firstName?.trim() || "";
  let last = fields.last_name?.trim() || fields.lastName?.trim() || null;

  const full = fields.full_name?.trim() || fields.name?.trim() || fields.fullName?.trim() || "";
  if (!first && full) {
    const parts = full.split(/\s+/).filter(Boolean);
    first = parts[0] ?? "";
    if (parts.length > 1) last = parts.slice(1).join(" ");
  }

  return { first, last };
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const fields = await parseBody(req);
    const contact_email = pickEmail(fields);
    if (!contact_email) {
      return NextResponse.json(
        { error: "A valid contact email is required." },
        { status: 400, headers }
      );
    }

    const { first, last } = pickNames(fields);
    if (!first) {
      return NextResponse.json(
        { error: "Name or first name is required." },
        { status: 400, headers }
      );
    }

    const result = await createLeadFromContact({
      first_name: first,
      last_name: last,
      contact_email,
      message: pickMessage(fields),
    });

    if ("error" in result) {
      console.error("[api/contact] createLeadFromContact:", result.error);
      const body: Record<string, string> = { error: GENERIC_ERROR };
      if (process.env.NODE_ENV !== "production") body.detail = result.error;
      return NextResponse.json(body, { status: 500, headers });
    }

    return NextResponse.json({ ok: true }, { headers });
  } catch (e) {
    console.error("[api/contact]", e);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500, headers });
  }
}
