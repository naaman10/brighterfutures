import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ enrollmentId: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { enrollmentId } = await context.params;
  
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ADMIN_API_KEY not configured" }, { status: 500 });
  }

  const baseUrl = process.env.BFT_API_BASE_URL?.trim().replace(/\/$/, "") ?? "https://bft-api.onrender.com";
  const url = `${baseUrl}/admin/assessment/${encodeURIComponent(enrollmentId)}`;

  try {
    const body = await req.json();
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Api-Key": apiKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.message || "Failed to save assessment" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("[assessment] save failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
