import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const studentId = searchParams.get("studentId");
  
  if (!studentId) {
    return NextResponse.json({ error: "studentId parameter required" }, { status: 400 });
  }

  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ADMIN_API_KEY not configured" }, { status: 500 });
  }

  const baseUrl = process.env.BFT_API_BASE_URL?.trim().replace(/\/$/, "") ?? "https://bft-api.onrender.com";
  const url = `${baseUrl}/admin/content?studentId=${encodeURIComponent(studentId)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Admin-Api-Key": apiKey,
      },
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json({
      url,
      status: response.status,
      ok: response.ok,
      rawResponse: data,
      enrollmentsFound: Array.isArray(data.enrollments) ? data.enrollments.length : 0,
      firstEnrollment: Array.isArray(data.enrollments) && data.enrollments.length > 0 
        ? data.enrollments[0] 
        : null,
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : "Unknown error",
      url,
    }, { status: 500 });
  }
}
