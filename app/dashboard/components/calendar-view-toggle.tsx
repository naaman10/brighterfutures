"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CalendarView } from "@/lib/calendar-utils";
import { buildDashboardCalendarUrl } from "@/lib/calendar-utils";

type Props = {
  view: CalendarView | null;
  monthParam: string;
  weekParam: string;
};

export function CalendarViewToggle({ view, monthParam, weekParam }: Props) {
  const router = useRouter();
  const [defaultView, setDefaultView] = useState<CalendarView>("month");

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setDefaultView(mq.matches ? "week" : "month");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  function setView(nextView: CalendarView) {
    router.push(
      buildDashboardCalendarUrl({
        view: nextView,
        month: monthParam,
        week: nextView === "week" ? weekParam : undefined,
      })
    );
  }

  const activeView = view ?? defaultView;

  return (
    <div
      className="inline-flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700"
      role="group"
      aria-label="Calendar view"
    >
      <button
        type="button"
        onClick={() => setView("week")}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          activeView === "week"
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        }`}
        aria-pressed={activeView === "week"}
      >
        Week
      </button>
      <button
        type="button"
        onClick={() => setView("month")}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          activeView === "month"
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        }`}
        aria-pressed={activeView === "month"}
      >
        Month
      </button>
    </div>
  );
}
