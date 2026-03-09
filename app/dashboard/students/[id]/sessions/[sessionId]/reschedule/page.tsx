import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionById, getStudentById } from "@/lib/db";
import { formatDisplayDate, formatDisplayTime } from "@/lib/format";
import { RescheduleSessionForm } from "./reschedule-session-form";

type Props = { params: Promise<{ id: string; sessionId: string }> };

export default async function RescheduleSessionPage({ params }: Props) {
  const { id: studentId, sessionId } = await params;
  const [session, student] = await Promise.all([
    getSessionById(sessionId),
    getStudentById(studentId),
  ]);
  if (!session || !student || session.student_id !== studentId) notFound();
  if (session.status === "rescheduled" || session.status === "planned_reschedule") {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Dashboard
        </Link>
        <span className="text-zinc-400 dark:text-zinc-500">/</span>
        <Link
          href={`/dashboard/students/${studentId}`}
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          {student.first_name} {student.last_name}
        </Link>
        <span className="text-zinc-400 dark:text-zinc-500">/</span>
        <Link
          href={`/dashboard/students/${studentId}/sessions/${sessionId}`}
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Session
        </Link>
        <span className="text-zinc-400 dark:text-zinc-500">/</span>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Reschedule
        </span>
      </div>

      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Reschedule session
        </h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Original: {formatDisplayDate(session.session_date)} at{" "}
          {formatDisplayTime(session.session_time)} — {session.subject}
        </p>
        <RescheduleSessionForm
          sessionId={sessionId}
          studentId={studentId}
          defaultSubject={session.subject ?? ""}
        />
      </div>
    </div>
  );
}
