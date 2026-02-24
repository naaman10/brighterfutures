import { NextResponse } from "next/server";

/**
 * Debug route: returns the exact redirect_uri this app sends to Google.
 * Add this EXACT value to Google Cloud Console → Credentials → OAuth client → Authorized redirect URIs.
 * Remove this route before deploying to production.
 */
export async function GET() {
  const basePath = "api/auth";
  const action = "callback/google";
  const envUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;

  let origin: string;
  if (envUrl) {
    const u = new URL(envUrl);
    origin = u.origin;
  } else {
    const host = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    origin = host.startsWith("http") ? new URL(host).origin : `http://${host}`;
  }

  const redirectUri = `${origin.replace(/\/$/, "")}/${basePath}/${action}`;

  return NextResponse.json({
    redirect_uri: redirectUri,
    message:
      "Add this EXACT value to Google Console → Credentials → your OAuth 2.0 Client ID → Authorized redirect URIs",
    env_used: envUrl ? "AUTH_URL or NEXTAUTH_URL" : "inferred (no AUTH_URL set)",
  });
}
