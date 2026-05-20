import type { SessionWithStudent } from "@/lib/db";
import { WeekCalendarView } from "./week-calendar-view";
import type { CalendarView } from "@/lib/calendar-utils";

type Props = {
  weekAnchor: string;
  monthParam: string;
  view: CalendarView | null;
  sessions: SessionWithStudent[];
};

export function WeekCalendar({ weekAnchor, monthParam, view, sessions }: Props) {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <WeekCalendarView
        weekAnchor={weekAnchor}
        monthParam={monthParam}
        view={view}
        sessions={sessions}
      />
    </div>
  );
}
