import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { enrollStudentInContent } from "@/lib/bft-learn";

export const dynamic = "force-dynamic";

type Body = { contentIds?: unknown };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await params;
  if (!studentId?.trim()) {
    return NextResponse.json({ error: "Student ID is required." }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = body.contentIds;
  const contentIds = Array.isArray(raw)
    ? raw.filter((id): id is string => typeof id === "string" && id.trim() !== "")
    : [];

  if (contentIds.length === 0) {
    return NextResponse.json({ error: "contentIds must be a non-empty array." }, { status: 400 });
  }

  const result = await enrollStudentInContent({ studentId: studentId.trim(), contentIds });
  if ("error" in result) {
    const status = result.status && result.status >= 400 && result.status < 600 ? result.status : 502;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
