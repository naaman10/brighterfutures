"use client";

import { useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { SessionWithStudent } from "@/lib/db";
import {
  filterSessionsForCalendar,
  getCalendarSessionClasses,
  isPlannedReschedule,
  SESSION_STATUS_LABELS,
} from "@/lib/session-status";
import { formatDisplayTime } from "@/lib/format";
import {
  movePlannedRescheduleSessionFromCalendarAction,
  rescheduleSessionFromCalendarAction,
} from "@/app/dashboard/calendar-actions";
import { BirthdayEmoji } from "./birthday-emoji";
import { GoogleMeetCalendarIcon } from "./google-meet-calendar-icon";
import { WeekCalendarScrollArea } from "./week-calendar-scroll";
import {
  WEEKDAYS_SHORT,
  canDragSession,
  clampScheduleMinutes,
  isCalendarDragMoveOnly,
  HOUR_HEIGHT_PX,
  minutesToTimeString,
  parseTimeToMinutes,
  SESSION_BLOCK_MINUTES,
  toDateKey,
  type CalendarView,
} from "@/lib/calendar-utils";

const EDGE_ZONE_PX = 48;
const EDGE_HOLD_MS = 750;
const EDGE_COOLDOWN_MS = 1200;
const CLICK_DRAG_THRESHOLD_PX = 4;
const SCROLL_EDGE_PX = 56;
const SCROLL_MAX_SPEED_PX = 14;

function computeVerticalScrollSpeed(clientY: number, scrollEl: HTMLDivElement): number {
  const rect = scrollEl.getBoundingClientRect();
  const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
  if (maxScroll <= 0) return 0;

  if (clientY < rect.top) return -SCROLL_MAX_SPEED_PX;
  if (clientY > rect.bottom) return SCROLL_MAX_SPEED_PX;

  const fromTop = clientY - rect.top;
  const fromBottom = rect.bottom - clientY;

  if (fromTop < SCROLL_EDGE_PX) {
    return -SCROLL_MAX_SPEED_PX * (1 - fromTop / SCROLL_EDGE_PX);
  }
  if (fromBottom < SCROLL_EDGE_PX) {
    return SCROLL_MAX_SPEED_PX * (1 - fromBottom / SCROLL_EDGE_PX);
  }
  return 0;
}

type DragSession = Pick<
  SessionWithStudent,
  | "id"
  | "student_id"
  | "subject"
  | "student_first_name"
  | "student_last_name"
  | "session_date"
  | "session_time"
  | "status"
>;

type DragState = {
  session: DragSession;
  originDate: string;
  originMinutes: number;
  dayIndex: number;
  minutes: number;
  pointerId: number;
};

type Props = {
  dates: string[];
  weekAnchor: string;
  monthParam: string;
  view: CalendarView | null;
  sessions: SessionWithStudent[];
  startHour: number;
  endHour: number;
  hours: number[];
  gridHeight: number;
  startMinutes: number;
  initialScrollTop: number;
  birthdayTooltips: Record<string, string>;
  gridCols: string;
  slideClass?: string;
  onShiftWeekWhileDragging: (delta: -1 | 1) => void;
  onBeforeCommitDrop: () => void;
  isPreviewWeek?: boolean;
};

function sessionBlockHeightPx(): number {
  return (SESSION_BLOCK_MINUTES / 60) * HOUR_HEIGHT_PX;
}

export function WeekCalendarGrid({
  dates,
  weekAnchor,
  monthParam,
  view,
  sessions,
  startHour,
  endHour,
  hours,
  gridHeight,
  startMinutes,
  initialScrollTop,
  birthdayTooltips,
  gridCols,
  slideClass = "",
  onShiftWeekWhileDragging,
  onBeforeCommitDrop,
  isPreviewWeek = false,
}: Props) {
  const router = useRouter();
  const todayStr = toDateKey(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const dayColumnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const edgeStateRef = useRef({
    activeEdge: null as "left" | "right" | null,
    edgeEnteredAt: null as number | null,
    lastNavAt: 0,
  });
  const [drag, setDrag] = useState<DragState | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [edgeHint, setEdgeHint] = useState<"left" | "right" | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const movedRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const autoScrollRafRef = useRef<number | null>(null);
  dragRef.current = drag;

  const visibleSessions = filterSessionsForCalendar(sessions);

  const sessionsByDate = new Map<string, SessionWithStudent[]>();
  for (const s of visibleSessions) {
    const d = toDateKey(s.session_date);
    if (!dates.includes(d)) continue;
    if (!sessionsByDate.has(d)) sessionsByDate.set(d, []);
    sessionsByDate.get(d)!.push(s);
  }

  const minutesFromClientY = useCallback(
    (clientY: number, dateKey: string): number | null => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return null;
      const scrollRect = scrollEl.getBoundingClientRect();
      const contentY = clientY - scrollRect.top + scrollEl.scrollTop;
      const rawMinutes = startHour * 60 + (contentY / HOUR_HEIGHT_PX) * 60;
      return clampScheduleMinutes(dateKey, rawMinutes, endHour);
    },
    [startHour, endHour]
  );

  const resolveSlot = useCallback(
    (clientX: number, clientY: number): { dayIndex: number; minutes: number } | null => {
      for (let i = 0; i < dates.length; i++) {
        const col = dayColumnRefs.current[i];
        if (!col) continue;
        const rect = col.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right) {
          const minutes = minutesFromClientY(clientY, dates[i]!);
          if (minutes == null) return null;
          return { dayIndex: i, minutes };
        }
      }

      const scrollEl = scrollRef.current;
      const current = dragRef.current;
      if (!scrollEl || !current) return null;
      const scrollRect = scrollEl.getBoundingClientRect();
      const inScrollBand =
        clientX >= scrollRect.left &&
        clientX <= scrollRect.right &&
        clientY >= scrollRect.top - SCROLL_EDGE_PX &&
        clientY <= scrollRect.bottom + SCROLL_EDGE_PX;
      if (!inScrollBand) return null;

      const minutes = minutesFromClientY(clientY, dates[current.dayIndex]!);
      if (minutes == null) return null;
      return { dayIndex: current.dayIndex, minutes };
    },
    [dates, minutesFromClientY]
  );

  const shiftWeekWhileDragging = useCallback(
    (delta: -1 | 1) => {
      const now = Date.now();
      if (now - edgeStateRef.current.lastNavAt < EDGE_COOLDOWN_MS) return;
      edgeStateRef.current.lastNavAt = now;
      edgeStateRef.current.edgeEnteredAt = null;
      edgeStateRef.current.activeEdge = null;
      setEdgeHint(null);
      onShiftWeekWhileDragging(delta);
    },
    [onShiftWeekWhileDragging]
  );

  const checkWeekEdge = useCallback(
    (clientX: number) => {
      const cal = calendarRef.current;
      if (!cal) return;
      const rect = cal.getBoundingClientRect();
      let edge: "left" | "right" | null = null;
      if (clientX <= rect.left + EDGE_ZONE_PX) edge = "left";
      else if (clientX >= rect.right - EDGE_ZONE_PX) edge = "right";

      const state = edgeStateRef.current;
      if (edge !== state.activeEdge) {
        state.activeEdge = edge;
        state.edgeEnteredAt = edge ? Date.now() : null;
        setEdgeHint(edge);
      } else if (
        edge &&
        state.edgeEnteredAt &&
        Date.now() - state.edgeEnteredAt >= EDGE_HOLD_MS
      ) {
        shiftWeekWhileDragging(edge === "left" ? -1 : 1);
      } else if (!edge) {
        setEdgeHint(null);
      }
    },
    [shiftWeekWhileDragging]
  );

  const commitDrop = useCallback(
    async (current: DragState) => {
      const targetDate = dates[current.dayIndex];
      if (!targetDate) return;

      const targetTime = minutesToTimeString(current.minutes);
      const originTime = minutesToTimeString(current.originMinutes);

      if (targetDate === current.originDate && targetTime === originTime) {
        return;
      }

      const moveOnly = isCalendarDragMoveOnly(current.session.status);

      onBeforeCommitDrop();
      setPending(true);
      const result = moveOnly
        ? await movePlannedRescheduleSessionFromCalendarAction(
            current.session.id,
            current.session.student_id,
            targetDate,
            targetTime
          )
        : await rescheduleSessionFromCalendarAction(
            current.session.id,
            current.session.student_id,
            targetDate,
            targetTime
          );
      setPending(false);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(moveOnly ? "Session moved." : "Session rescheduled.");
      router.refresh();
    },
    [dates, onBeforeCommitDrop, router]
  );

  const endDrag = useCallback(
    async (pointerId: number, cancelled = false) => {
      const current = dragRef.current;
      if (!current || current.pointerId !== pointerId) return;

      edgeStateRef.current.activeEdge = null;
      edgeStateRef.current.edgeEnteredAt = null;
      setEdgeHint(null);
      setDrag(null);
      setGhostPos(null);
      setHasMoved(false);
      dragRef.current = null;

      if (cancelled) return;

      if (!movedRef.current) {
        router.push(
          `/dashboard/students/${current.session.student_id}/sessions/${current.session.id}`
        );
        return;
      }

      await commitDrop(current);
    },
    [commitDrop, router]
  );

  const applySlotFromPointer = useCallback(
    (clientX: number, clientY: number, pointerId: number) => {
      const slot = resolveSlot(clientX, clientY);
      if (!slot) return;
      setDrag((prev) =>
        prev && prev.pointerId === pointerId
          ? { ...prev, dayIndex: slot.dayIndex, minutes: slot.minutes }
          : prev
      );
    },
    [resolveSlot]
  );

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number, pointerId: number) => {
      const current = dragRef.current;
      if (!current || current.pointerId !== pointerId) return;

      lastPointerRef.current = { x: clientX, y: clientY };

      if (
        Math.hypot(
          clientX - pointerStartRef.current.x,
          clientY - pointerStartRef.current.y
        ) >= CLICK_DRAG_THRESHOLD_PX
      ) {
        movedRef.current = true;
        setHasMoved(true);
      }

      setGhostPos({ x: clientX, y: clientY });
      applySlotFromPointer(clientX, clientY, pointerId);
      checkWeekEdge(clientX);
    },
    [applySlotFromPointer, checkWeekEdge]
  );

  const tickAutoScroll = useCallback(() => {
    const current = dragRef.current;
    if (!current) return;

    const scrollEl = scrollRef.current;
    if (!scrollEl) {
      autoScrollRafRef.current = requestAnimationFrame(tickAutoScroll);
      return;
    }

    const { x, y } = lastPointerRef.current;
    const speed = computeVerticalScrollSpeed(y, scrollEl);
    if (speed !== 0) {
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
      const before = scrollEl.scrollTop;
      scrollEl.scrollTop = Math.max(0, Math.min(maxScroll, before + speed));
      if (scrollEl.scrollTop !== before) {
        applySlotFromPointer(x, y, current.pointerId);
      }
    }

    autoScrollRafRef.current = requestAnimationFrame(tickAutoScroll);
  }, [applySlotFromPointer]);

  useLayoutEffect(() => {
    if (!drag) return;

    const pointerId = drag.pointerId;
    lastPointerRef.current = pointerStartRef.current;

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      handlePointerMove(e.clientX, e.clientY, pointerId);
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      void endDrag(pointerId);
    };

    const onCancel = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      void endDrag(pointerId, true);
    };

    autoScrollRafRef.current = requestAnimationFrame(tickAutoScroll);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      if (autoScrollRafRef.current != null) {
        cancelAnimationFrame(autoScrollRafRef.current);
        autoScrollRafRef.current = null;
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [drag, handlePointerMove, endDrag, tickAutoScroll]);

  const onSessionPointerDown = (
    e: React.PointerEvent,
    session: SessionWithStudent,
    dayIndex: number
  ) => {
    if (!canDragSession(session.status) || pending || drag) return;
    if (e.button !== 0) return;

    const mins = parseTimeToMinutes(session.session_time);
    if (mins == null) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    movedRef.current = false;
    setHasMoved(false);
    pointerStartRef.current = { x: e.clientX, y: e.clientY };

    const initial: DragState = {
      session,
      originDate: dates[dayIndex]!,
      originMinutes: mins,
      dayIndex,
      minutes: mins,
      pointerId: e.pointerId,
    };

    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    dragRef.current = initial;
    setDrag(initial);
    setGhostPos({ x: e.clientX, y: e.clientY });
  };

  const ghostTop =
    drag != null ? ((drag.minutes - startMinutes) / 60) * HOUR_HEIGHT_PX : 0;
  const ghostHeight = sessionBlockHeightPx();

  return (
    <div
      ref={calendarRef}
      className={`relative flex h-full min-h-0 flex-1 flex-col overflow-hidden ${
        pending ? "pointer-events-none opacity-60" : ""
      } ${drag ? "select-none" : ""}`}
    >
      {edgeHint && drag && (
        <div
          className={`pointer-events-none absolute inset-y-0 z-30 w-12 ${
            edgeHint === "left" ? "left-0" : "right-0"
          } bg-[#f75074]/10`}
          aria-hidden
        />
      )}

      {isPreviewWeek && drag && (
        <p className="pointer-events-none absolute left-0 right-0 top-0 z-[101] bg-[#f75074] px-2 py-1 text-center text-xs font-medium text-white">
          Release to place session on this week
        </p>
      )}

      <div
        className={`flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden ${slideClass}`}
      >
        <div className={`${gridCols} shrink-0 border-b border-zinc-200 dark:border-zinc-700`}>
          <div className="sticky left-0 z-20 bg-white dark:bg-zinc-900" />
          {dates.map((dk, i) => {
            const d = new Date(`${dk}T12:00:00`);
            const isToday = dk === todayStr;
            return (
              <div
                key={dk}
                className="border-l border-zinc-200 px-0.5 py-1.5 text-center dark:border-zinc-700"
              >
                <div className="text-[9px] font-medium uppercase tracking-wide text-zinc-500 md:text-xs dark:text-zinc-400">
                  {WEEKDAYS_SHORT[i]}
                </div>
                <div className="mt-0.5 flex justify-center">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold md:h-7 md:w-7 md:text-sm ${
                      isToday
                        ? "bg-[#f75074] text-white"
                        : "text-zinc-900 dark:text-zinc-50"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <WeekCalendarScrollArea ref={scrollRef} initialScrollTop={initialScrollTop}>
          <div className={`${gridCols} relative min-w-[280px] md:min-w-0`}>
            <div
              className="sticky left-0 z-20 border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              style={{ height: gridHeight }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="relative border-b border-zinc-100 text-right text-[9px] leading-none text-zinc-500 md:text-xs dark:border-zinc-800 dark:text-zinc-400"
                  style={{ height: HOUR_HEIGHT_PX }}
                >
                  <span className="absolute -top-1.5 right-0.5">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {dates.map((dk, dayIndex) => {
              const daySessions = sessionsByDate.get(dk) ?? [];
              const isDropTarget = drag?.dayIndex === dayIndex;

              return (
                <div
                  key={dk}
                  ref={(el) => {
                    dayColumnRefs.current[dayIndex] = el;
                  }}
                  data-day-column
                  className={`relative border-l border-zinc-200 dark:border-zinc-700 ${
                    isDropTarget ? "bg-zinc-50/80 dark:bg-zinc-800/40" : ""
                  }`}
                  style={{ height: gridHeight }}
                >
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                      style={{ height: HOUR_HEIGHT_PX }}
                    />
                  ))}

                  {daySessions.map((s) => {
                    const mins = parseTimeToMinutes(s.session_time);
                    if (mins == null) return null;
                    const top = ((mins - startMinutes) / 60) * HOUR_HEIGHT_PX;
                    const height = ghostHeight;
                    const tooltip = birthdayTooltips[s.id] ?? null;
                    const isDragging = drag?.session.id === s.id;
                    const draggable = canDragSession(s.status);

                    return (
                      <div
                        key={s.id}
                        role="button"
                        tabIndex={0}
                        onPointerDown={(e) =>
                          draggable
                            ? onSessionPointerDown(e, s, dayIndex)
                            : undefined
                        }
                        onClick={() => {
                          if (draggable) return;
                          router.push(
                            `/dashboard/students/${s.student_id}/sessions/${s.id}`
                          );
                        }}
                        className={`absolute left-0.5 right-0.5 z-10 overflow-hidden rounded border px-1 py-0.5 text-[9px] leading-tight shadow-sm md:left-1 md:right-1 md:px-1.5 md:text-xs ${getCalendarSessionClasses(s.status)} ${
                          draggable
                            ? "cursor-grab touch-none active:cursor-grabbing"
                            : "cursor-pointer"
                        } ${isDragging && hasMoved ? "invisible" : ""}`}
                        style={{
                          top: `${top}px`,
                          height: `${height - 2}px`,
                          minHeight: "1rem",
                        }}
                        title={`${formatDisplayTime(s.session_time)} ${s.student_first_name} ${s.student_last_name} – ${s.subject} (${SESSION_STATUS_LABELS[s.status ?? "planned"]})${draggable ? (isCalendarDragMoveOnly(s.status) ? " — drag to move" : " — drag to reschedule") : ""}`}
                      >
                        <span
                          className={`block truncate font-medium ${
                            isPlannedReschedule(s.status)
                              ? "text-red-900 dark:text-red-100"
                              : "text-zinc-900 dark:text-zinc-50"
                          }`}
                        >
                          {formatDisplayTime(s.session_time)}
                        </span>
                        <span
                          className={`flex min-w-0 items-center gap-0.5 truncate ${
                            isPlannedReschedule(s.status)
                              ? "text-red-800 dark:text-red-200"
                              : "text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {s.google_meet_added ? (
                            <GoogleMeetCalendarIcon className="text-[9px] md:text-[11px]" />
                          ) : null}
                          <span className="min-w-0 truncate md:hidden">
                            {s.student_first_name} {s.student_last_name.charAt(0)}.
                          </span>
                          <span className="hidden min-w-0 truncate md:inline">
                            {s.student_first_name} {s.student_last_name}
                          </span>
                        </span>
                        {tooltip ? (
                          <span className="absolute right-px top-px">
                            <BirthdayEmoji tooltip={tooltip} />
                          </span>
                        ) : null}
                      </div>
                    );
                  })}

                  {drag && isDropTarget && (
                    <div
                      className="pointer-events-none absolute left-0.5 right-0.5 z-20 rounded border-2 border-dashed border-[#f75074] bg-[#f75074]/10 md:left-1 md:right-1"
                      style={{
                        top: `${ghostTop}px`,
                        height: `${ghostHeight - 2}px`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </WeekCalendarScrollArea>
      </div>

      {drag && ghostPos && (
        <div
          className="pointer-events-none fixed z-[102] w-36 max-w-[40vw] overflow-hidden rounded border border-[#f75074] bg-white px-2 py-1 text-xs shadow-lg dark:bg-zinc-800"
          style={{
            left: ghostPos.x,
            top: ghostPos.y + 8,
            transform: "translateX(-50%)",
            height: ghostHeight,
          }}
        >
          <span className="block truncate font-medium">
            {minutesToTimeString(drag.minutes)} — {drag.session.student_first_name}{" "}
            {drag.session.student_last_name}
          </span>
        </div>
      )}
    </div>
  );
}
