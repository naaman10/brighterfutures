"use client";

import Link from "next/link";
import NextImage from "next/image";
import { usePathname } from "next/navigation";
import { MaterialSymbol } from "./material-symbol";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "calendar_month" },
  { href: "/dashboard/parents", label: "Parents", icon: "family_restroom" },
  { href: "/dashboard/students", label: "Students", icon: "school" },
  { href: "/dashboard/leads", label: "Leads", icon: "handshake" },
  { href: "/dashboard/invoices", label: "Invoices", icon: "receipt_long" },
  { href: "/dashboard/email-logs", label: "Email logs", icon: "mail" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
] as const;

type Props = {
  signOut: React.ReactNode;
  onClose?: () => void;
};

export function DashboardSidebar({ signOut, onClose }: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full min-h-0 w-full flex-col text-sidebar-text">
      <div className="relative flex items-center justify-center px-4 pb-3 pt-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 font-semibold tracking-tight text-sidebar-text"
        >
          <NextImage
            src="/bft-logo-no-text-white.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="text-sm">Brighter Futures</span>
        </Link>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-sidebar-muted hover:bg-white/10 hover:text-sidebar-text md:hidden"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-full px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "text-sidebar-muted hover:bg-white/10 hover:text-sidebar-text"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <MaterialSymbol name={item.icon} className="text-[14px] leading-none" fill={isActive} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">{signOut}</div>
    </aside>
  );
}
