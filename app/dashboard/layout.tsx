import { auth, signOut } from "@/auth";
import Link from "next/link";
import NextImage from "next/image";
import { DashboardSidebar } from "./components/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-14 items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            <NextImage
              src="/bft-logo-no-text.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            Brighter Futures
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {session?.user?.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <DashboardSidebar />
        <main className="min-w-0 flex-1 px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
