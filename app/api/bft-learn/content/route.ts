import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBftLearnContent } from "@/lib/bft-learn";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type")?.trim();
  const subject = searchParams.get("subject")?.trim();
  const ageGroup = searchParams.get("ageGroup")?.trim();

  const result = await getBftLearnContent({
    ...(type ? { type } : {}),
    ...(subject ? { subject } : {}),
    ...(ageGroup ? { ageGroup } : {}),
  });

  if ("error" in result) {
    const status = result.status && result.status >= 400 && result.status < 600 ? result.status : 502;
    return NextResponse.json(
      {
        error: result.error,
        url: result.url,
        baseUrl: process.env.BFT_API_BASE_URL?.trim().replace(/\/$/, "") ?? "https://bft-api.onrender.com",
      },
      { status }
    );
  }

  return NextResponse.json(result.data);
}
