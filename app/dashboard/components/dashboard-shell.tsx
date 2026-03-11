"use client";

import Link from "next/link";
import NextImage from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";

type Props = {
  children: React.ReactNode;
  headerRight: React.ReactNode;
};

export function DashboardShell({ children, headerRight }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 md:hidden"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              aria-expanded={sidebarOpen}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                {sidebarOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
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
              <span className="truncate">Brighter Futures</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">{headerRight}</div>
        </div>
      </header>

      {/* Mobile backdrop */}
      <button
        type="button"
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${
          sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
        tabIndex={-1}
      />

      <div className="flex min-h-0 flex-1">
        <div
          className={`fixed left-0 z-40 flex h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-900 md:static md:h-auto md:translate-x-0 md:min-h-0 md:transition-none ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ top: "3.5rem" }}
        >
          <DashboardSidebar />
        </div>
        <main className="min-w-0 flex-1 px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
