"use client";

import { useState } from "react";
import Link from "next/link";
import type { Parent } from "@/lib/db";
import { formatDisplayDate, formatDisplayTime } from "@/lib/format";

type ParentAccordionProps = {
  parent: Parent;
  index: number;
};

export function ParentAccordion({ parent, index }: ParentAccordionProps) {
  const [open, setOpen] = useState(false);
  const students = parent.students ?? [];
  const hasStudents = students.length > 0;

  return (
    <li className="border-b border-zinc-200 last:border-b-0 dark:border-zinc-700">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
          aria-expanded={open}
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {[parent.first_name, parent.last_name].filter(Boolean).join(" ") || "—"}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {parent.email ?? "—"}
              {parent.contact_number ? ` · ${parent.contact_number}` : null}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {hasStudents && (
              <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300">
                {students.length} student{students.length !== 1 ? "s" : ""}
              </span>
            )}
            <span
              className={`inline-block text-zinc-500 transition-transform dark:text-zinc-400 ${open ? "rotate-180" : ""}`}
              aria-hidden
            >
              ▼
            </span>
          </div>
        </button>
      </div>
      {open && (
        <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 pl-10 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Students
          </p>
          {!hasStudents ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No students added yet.</p>
          ) : (
            <ul className="space-y-2">
              {students.map((student) => (
                <li
                  key={student.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {[
                        student.age != null && `Age ${student.age}`,
                        formatDisplayDate(student.start_date) || null,
                        formatDisplayTime(student.start_time) || null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/students/${student.id}`}
                    className="shrink-0 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
