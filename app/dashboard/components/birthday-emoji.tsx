"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  tooltip: string;
};

export function BirthdayEmoji({ tooltip }: Props) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tooltipId = useMemo(
    () => `birthday-tooltip-${Math.random().toString(36).slice(2)}`,
    []
  );

  function updatePosition() {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      left: rect.left + rect.width / 2,
      top: rect.top,
    });
  }

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <>
      <span
        ref={anchorRef}
        className="inline-flex cursor-help select-none"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        tabIndex={0}
        aria-describedby={open ? tooltipId : undefined}
        aria-label={tooltip}
      >
        🎉
      </span>

      {mounted && open && pos
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              className="pointer-events-none fixed z-[9999]"
              style={{
                left: pos.left,
                top: pos.top,
                transform: "translate(-50%, calc(-100% - 10px))",
              }}
            >
              <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
                {tooltip}
              </div>
              <div className="mx-auto mt-1 h-2 w-2 rotate-45 border-b border-r border-zinc-700 bg-zinc-900" />
            </div>,
            document.body
          )
        : null}
    </>
  );
}

