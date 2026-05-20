"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type Props = {
  children: React.ReactNode;
  initialScrollTop: number;
};

export const WeekCalendarScrollArea = forwardRef<HTMLDivElement, Props>(
  function WeekCalendarScrollArea({ children, initialScrollTop }, ref) {
    const innerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => innerRef.current!, []);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      el.scrollTop = initialScrollTop;
    }, [initialScrollTop]);

    return (
      <div
        ref={innerRef}
        className="h-0 min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-y-contain touch-pan-y"
        aria-label="Session times, scroll for earlier or later hours"
      >
        {children}
      </div>
    );
  }
);
