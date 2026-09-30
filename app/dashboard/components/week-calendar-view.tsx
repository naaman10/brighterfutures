"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SessionWithStudent } from "@/lib/db";
import { pickBirthdaySessionIdByStudent } from "@/lib/birthday";
import { filterSessionsForCalendar } from "@/lib/session-status";
import { WeekCalendarGrid } from "./week-calendar-grid";
import {
  addDaysToDateKey,
  buildDashboardCalendarUrl,
  formatWeekLabel,
  getWeekGridHourRange,
  getWeekInitialScrollTopPx,
  getWeekRange,
  HOUR_HEIGHT_PX,
  toDateKey,
  type CalendarView,
} from "@/lib/calendar-utils";

type Props = {
  weekAnchor: string;
  monthParam: string;
  view: CalendarView | null;
  sessions: SessionWithStudent[];
};

export function WeekCalendarView({ weekAnchor, monthParam, view, sessions }: Props) {
  const router = useRouter();
  const baseMonday = getWeekRange(weekAnchor).dates[0]!;
  const [weekOffset, setWeekOffset] = useState(0);
  const [slideClass, setSlideClass] = useState("");

  useEffect(() => {
    setWeekOffset(0);
    setSlideClass("");
  }, [weekAnchor]);

  const displayRange = useMemo(
    () => getWeekRange(addDaysToDateKey(baseMonday, weekOffset * 7)),
    [baseMonday, weekOffset]
  );
  const displayDates = displayRange.dates;

  const visibleSessions = filterSessionsForCalendar(sessions);
  const birthdayTooltips = Object.fromEntries(
    pickBirthdaySessionIdByStudent(visibleSessions, 5)
  );

  const displaySessions = useMemo(
    () =>
      visibleSessions.filter((s) =>
        displayDates.includes(toDateKey(s.session_date))
      ),
    [visibleSessions, displayDates]
  );

  const { startHour, endHour } = useMemo(
    () => getWeekGridHourRange(displaySessions),
    [displaySessions]
  );
  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour]
  );
  const gridHeight = hours.length * HOUR_HEIGHT_PX;
  const startMinutes = startHour * 60;
  const initialScrollTop = getWeekInitialScrollTopPx(startHour);

  const navBase = view
    ? { month: monthParam, week: weekAnchor, view }
    : { month: monthParam, week: weekAnchor };

  const prevWeek = addDaysToDateKey(displayDates[0]!, -7);
  const nextWeek = addDaysToDateKey(displayDates[0]!, 7);

  const gridCols =
    "grid grid-cols-[2.25rem_repeat(7,minmax(1.75rem,1fr))] md:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]";

  const shiftWeekWhileDragging = useCallback((delta: -1 | 1) => {
    setSlideClass(delta > 0 ? "week-calendar-slide-next" : "week-calendar-slide-prev");
    setWeekOffset((o) => o + delta);
    window.setTimeout(() => setSlideClass(""), 280);
  }, []);

  const syncWeekToUrl = useCallback(() => {
    if (weekOffset === 0) return;
    const targetWeek = displayDates[0]!;
    router.replace(
      buildDashboardCalendarUrl({
        ...navBase,
        week: targetWeek,
        view: view ?? "week",
      })
    );
  }, [weekOffset, displayDates, navBase, router, view]);

  return (
    <div className="surface mx-auto flex h-[min(40rem,calc(100dvh-8rem))] min-h-[28rem] w-full max-w-lg flex-col overflow-hidden p-0 md:mx-0 md:h-[min(46rem,calc(100dvh-6rem))] md:max-w-none">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-5 py-3 dark:border-zinc-700">
        <Link
          href={buildDashboardCalendarUrl({ ...navBase, week: prevWeek })}
          className="rounded px-1.5 py-0.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-50"
          aria-label="Previous week"
        >
          ←
        </Link>
        <h2 className="text-center text-sm font-medium text-zinc-900 transition-opacity duration-200 dark:text-zinc-50">
          {formatWeekLabel(displayDates)}
        </h2>
        <Link
          href={buildDashboardCalendarUrl({ ...navBase, week: nextWeek })}
          className="rounded px-1.5 py-0.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-50"
          aria-label="Next week"
        >
          →
        </Link>
      </div>

      <div className="week-calendar-slide-container flex min-h-0 flex-1 flex-col overflow-hidden">
        <WeekCalendarGrid
          dates={displayDates}
          weekAnchor={displayDates[0]!}
          monthParam={monthParam}
          view={view}
          sessions={visibleSessions}
          startHour={startHour}
          endHour={endHour}
          hours={hours}
          gridHeight={gridHeight}
          startMinutes={startMinutes}
          initialScrollTop={initialScrollTop}
          birthdayTooltips={birthdayTooltips}
          gridCols={gridCols}
          slideClass={slideClass}
          onShiftWeekWhileDragging={shiftWeekWhileDragging}
          onBeforeCommitDrop={syncWeekToUrl}
          isPreviewWeek={weekOffset !== 0}
        />
      </div>
    </div>
  );
}
