import { auth } from "@/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="mb-4 text-muted">
          You are signed in as {session.user.email}.
        </p>
        <Link href="/dashboard" className="btn-primary">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <p className="mb-4 text-muted">
        Sign in to access the client dashboard.
      </p>
      <Link href="/login" className="btn-primary">
        Sign in
      </Link>
    </div>
  );
}
