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
      className="inline-flex rounded-full border border-zinc-200/80 bg-white p-0.5 shadow-[var(--shadow-card)] dark:border-zinc-700 dark:bg-zinc-900"
      role="group"
      aria-label="Calendar view"
    >
      <button
        type="button"
        onClick={() => setView("week")}
        className={`btn-tab ${
          activeView === "week"
            ? "bg-accent text-white"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        }`}
        aria-pressed={activeView === "week"}
      >
        Week
      </button>
      <button
        type="button"
        onClick={() => setView("month")}
        className={`btn-tab ${
          activeView === "month"
            ? "bg-accent text-white"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        }`}
        aria-pressed={activeView === "month"}
      >
        Month
      </button>
    </div>
  );
}
