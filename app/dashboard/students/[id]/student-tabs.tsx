"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Session, StudentDetail } from "@/lib/db";
import { SESSION_STATUS_LABELS } from "@/lib/session-status";
import { formatDisplayDate, formatDisplayTime } from "@/lib/format";
import { AddSessionForm } from "./add-session-form";
import { StudentAISummary } from "./student-ai-summary";

type TabKey = "details" | "sessions";

type Props = {
  studentId: string;
  student: StudentDetail;
  sessions: Session[];
  defaultTab?: TabKey;
  canSendWelcome: boolean;
  canResendWelcome: boolean;
  welcomeSentAtDisplay: string | null;
  welcomeActions: React.ReactNode;
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

export function StudentTabs({
  studentId,
  student,
  sessions,
  defaultTab = "details",
  canSendWelcome,
  canResendWelcome,
  welcomeSentAtDisplay,
  welcomeActions,
}: Props) {
  const [tab, setTab] = useState<TabKey>(defaultTab);

  const tabs = useMemo(
    () => [
      { key: "details" as const, label: "Details" },
      { key: "sessions" as const, label: "Sessions" },
    ],
    []
  );

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
          href={`/dashboard/students/${studentId}/edit`}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Update details
        </Link>
      </div>

      {tab === "details" ? (
        <div className="space-y-6">
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Basic details
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Age
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                  {student.age != null ? student.age : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Date of birth
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                  {student.dob ? formatDisplayDate(student.dob) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Start date
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                  {formatDisplayDate(student.start_date) || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Start time
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                  {formatDisplayTime(student.start_time) || "—"}
                </dd>
              </div>
              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Parent
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                  {student.parent_name ?? "—"}
                </dd>
                {student.parent_email && (
                  <dd className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                    {student.parent_email}
                  </dd>
                )}
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              School
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Current school
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                  {student.current_school ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Year group
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                  {student.current_year_group ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Exam board
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                  {student.exam_board ?? "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              SEN &amp; medical
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  SEN needs
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-zinc-900 dark:text-zinc-50">
                  {student.sen_needs ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Medical conditions
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-zinc-900 dark:text-zinc-50">
                  {student.medical_conditions ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Medication
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-zinc-900 dark:text-zinc-50">
                  {student.medication ?? "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Collection
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Collector name
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                  {student.collector_name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Leave independently
                </dt>
                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                  {student.leave_independantly === true
                    ? "Yes"
                    : student.leave_independantly === false
                      ? "No"
                      : "—"}
                </dd>
              </div>
            </dl>
          </section>

          {(canSendWelcome || student.welcome) && (
            <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Welcome email
              </h2>
              <div className="space-y-2">
                {welcomeActions}
                {student.welcome && welcomeSentAtDisplay && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Sent on {welcomeSentAtDisplay}
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-xl bg-black p-6 text-white">
            <h2 className="mb-3 text-lg font-medium text-white">
              AI summary
            </h2>
            <p className="mb-4 text-sm text-zinc-300">
              Generate a summary of the student&apos;s progress and recommended focus areas from all session summaries and feedback.
            </p>
            <StudentAISummary studentId={studentId} initialSummary={student.ai_summary} />
          </div>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Sessions
              </h2>
            </div>
            <div className="mb-6">
              <AddSessionForm studentId={studentId} />
            </div>
            {sessions.length === 0 ? (
              <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                No sessions yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {sessions.map((session) => (
                      <tr key={session.id}>
                        <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                          {formatDisplayDate(session.session_date) || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                          {formatDisplayTime(session.session_time) || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50">
                          {session.subject}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                          {SESSION_STATUS_LABELS[session.status ?? "planned"]}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/dashboard/students/${studentId}/sessions/${session.id}`}
                            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

