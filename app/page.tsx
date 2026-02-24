import { auth } from "@/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">
          You are signed in as {session.user.email}.
        </p>
        <Link
          href="/dashboard"
          className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <p className="mb-4 text-zinc-600 dark:text-zinc-400">
        Sign in to access the client dashboard.
      </p>
      <Link
        href="/login"
        className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Sign in
      </Link>
    </div>
  );
}
