"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";

type Props = {
  children: React.ReactNode;
  signOut: React.ReactNode;
};

export function DashboardShell({ children, signOut }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-transparent">
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-sidebar text-sidebar-text shadow-[var(--shadow-card)] md:hidden"
          aria-label="Open menu"
          aria-expanded={false}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      <button
        type="button"
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${
          sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
        tabIndex={-1}
      />

      <div
        className={`fixed inset-0 z-40 flex w-full shrink-0 flex-col overflow-hidden bg-sidebar shadow-[0_12px_40px_rgba(28,25,23,0.12)] transition-transform duration-200 ease-out md:inset-auto md:sticky md:top-4 md:m-4 md:h-[calc(100dvh-2rem)] md:w-56 md:rounded-3xl md:translate-x-0 md:self-start md:transition-none ${
          sidebarOpen ? "translate-x-0" : "max-md:-translate-x-full"
        }`}
      >
        <DashboardSidebar signOut={signOut} onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="min-w-0 flex-1 px-4 pb-8 pt-16 md:px-8 md:py-4">
        {children}
      </main>
    </div>
  );
}
