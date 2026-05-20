import { Suspense } from "react";
import type { SessionWithStudent } from "@/lib/db";
import type { CalendarView } from "@/lib/calendar-utils";
import { CalendarViewToggle } from "./calendar-view-toggle";
import { MonthCalendar } from "./month-calendar";
import { WeekCalendar } from "./week-calendar";

type Props = {
  view: CalendarView | null;
  year: number;
  month: number;
  monthParam: string;
  weekParam: string;
  sessions: SessionWithStudent[];
  fillHeight?: boolean;
};

const weekWrapperClass =
  "flex min-h-0 w-full flex-1 flex-col overflow-hidden md:h-full md:flex-1";

export function DashboardCalendar({
  view,
  year,
  month,
  monthParam,
  weekParam,
  sessions,
  fillHeight = false,
}: Props) {
  const showWeek = view === "week";
  const showMonth = view === "month" || view == null;

  return (
    <div
      className={
        fillHeight
          ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden md:flex-1"
          : "w-full"
      }
    >
      <div className="mb-3 flex shrink-0 justify-end">
        <Suspense fallback={<div className="h-9 w-28 rounded-lg border border-zinc-200 dark:border-zinc-700" />}>
          <CalendarViewToggle view={view} monthParam={monthParam} weekParam={weekParam} />
        </Suspense>
      </div>

      {/* No view param: week on mobile, month on desktop */}
      {view == null && (
        <>
          <div className={`md:hidden ${fillHeight ? weekWrapperClass : ""}`}>
            <WeekCalendar
              weekAnchor={weekParam}
              monthParam={monthParam}
              view={null}
              sessions={sessions}
            />
          </div>
          <div className="hidden md:block">
            <MonthCalendar
              year={year}
              month={month}
              monthParam={monthParam}
              view={null}
              sessions={sessions}
            />
          </div>
        </>
      )}

      {showWeek && view != null && (
        <div className={fillHeight ? weekWrapperClass : undefined}>
          <WeekCalendar
            weekAnchor={weekParam}
            monthParam={monthParam}
            view={view}
            sessions={sessions}
          />
        </div>
      )}

      {showMonth && view != null && (
        <MonthCalendar
          year={year}
          month={month}
          monthParam={monthParam}
          view={view}
          sessions={sessions}
        />
      )}
    </div>
  );
}
