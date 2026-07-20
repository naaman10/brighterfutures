"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ParentBasic, StudentSummary } from "@/lib/db";
import { formatDisplayDateTime } from "@/lib/format";
import { RecordStatusBadge } from "@/app/dashboard/components/record-status-badge";
import { parseRecordStatus } from "@/lib/record-status";
import { MarkdownContent } from "../../components/markdown-content";

type TabKey = "details" | "terms";

type Props = {
  parentId: string;
  parent: ParentBasic;
  students: StudentSummary[];
  defaultTab?: TabKey;
};

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
      ].join(" ")}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

export function ParentTabs({ parentId, parent, students, defaultTab = "details" }: Props) {
  const [tab, setTab] = useState<TabKey>(defaultTab);

  const tabs = useMemo(
    () => [
      { key: "details" as const, label: "Details" },
      { key: "terms" as const, label: "Terms" },
    ],
    []
  );

  const termsAcceptedDisplay = formatDisplayDateTime(parent.terms);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
          {tabs.map((t) => (
            <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </TabButton>
          ))}
        </div>
        <Link
          href={`/dashboard/parents/${parentId}/edit`}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Edit parent
        </Link>
      </div>

      {tab === "details" ? (
        <div className="space-y-8">
          <div className="space-y-6">
            <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Contact
              </h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Email
                  </dt>
                  <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">{parent.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Contact number
                  </dt>
                  <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                    {parent.contact_number ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Secondary contact number
                  </dt>
                  <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                    {parent.secondary_contact_number ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Relationship
                  </dt>
                  <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                    {parent.relationship ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Session rate
                  </dt>
                  <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                    {parent.session_rate != null ? `£${parent.session_rate} per session` : "—"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Address
              </h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Address line 1
                  </dt>
                  <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                    {parent.address_line_1 ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Address line 2
                  </dt>
                  <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                    {parent.address_line_2 ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Town
                  </dt>
                  <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">{parent.town ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Post code
                  </dt>
                  <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">{parent.post_code ?? "—"}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Emergency contact
              </h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Name
                  </dt>
                  <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                    {[parent.emergency_first_name, parent.emergency_last_name]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Relationship
                  </dt>
                  <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                    {parent.emergency_relation ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Contact number
                  </dt>
                  <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                    {parent.emergency_contact ?? "—"}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Students ({students.length})
              </h2>
              <Link
                href={`/dashboard/parents/${parentId}/students/new`}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Add student
              </Link>
            </div>

            {students.length === 0 ? (
              <p className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                No students added yet.
              </p>
            ) : (
              <ul className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                {students.map((student) => (
                  <li
                    key={student.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 last:border-b-0 dark:border-zinc-700"
                  >
                    <div>
                      <p className="flex flex-wrap items-center gap-2 font-medium text-zinc-900 dark:text-zinc-50">
                        {student.first_name} {student.last_name}
                        <RecordStatusBadge status={parseRecordStatus(student.status)} />
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {student.age != null ? `Age ${student.age}` : "—"}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/students/${student.id}`}
                      className="shrink-0 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                    >
                      View student
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Terms
          </h2>
          <dl className="mb-6 space-y-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Accepted
              </dt>
              <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                {termsAcceptedDisplay || "—"}
              </dd>
            </div>
          </dl>
          {parent.terms_text?.trim() ? (
            <MarkdownContent content={parent.terms_text.trim()} />
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No terms recorded for this parent.</p>
          )}
        </section>
      )}
    </div>
  );
}
