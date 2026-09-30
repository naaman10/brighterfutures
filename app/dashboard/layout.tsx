import { signOut } from "@/auth";
import { DashboardShell } from "./components/dashboard-shell";
import { MaterialSymbol } from "./components/material-symbol";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      signOut={
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-full px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-white/10 hover:text-sidebar-text"
          >
            <MaterialSymbol name="exit_to_app" className="text-[14px] leading-none" />
            Sign out
          </button>
        </form>
      }
    >
      {children}
    </DashboardShell>
  );
}
