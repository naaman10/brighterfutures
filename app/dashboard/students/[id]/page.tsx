import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudentById, getSessionsByStudentId } from "@/lib/db";
import { formatDisplayDateTime } from "@/lib/format";
import { SendWelcomeEmailButton } from "./send-welcome-email-button";
import { RecordStatusBadge } from "@/app/dashboard/components/record-status-badge";
import { parseRecordStatus } from "@/lib/record-status";
import { StudentTabs } from "./student-tabs";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params;
  const [student, sessions] = await Promise.all([
    getStudentById(id),
    getSessionsByStudentId(id),
  ]);
  if (!student) notFound();

  const firstSession = sessions[0] ?? null;
  const canSendWelcome =
    firstSession != null &&
    firstSession.session_date != null &&
    firstSession.session_time != null &&
    (student.first_name ?? "").trim() !== "" &&
    (student.parent_email ?? "").trim() !== "" &&
    (student.parent_first_name ?? "").trim() !== "" &&
    student.welcome === false;

  const welcomeSentAtDisplay = formatDisplayDateTime(student.welcome_sent_at);

  const canResendWelcome =
    student.welcome &&
    firstSession != null &&
    firstSession.session_date != null &&
    firstSession.session_time != null &&
    (student.first_name ?? "").trim() !== "" &&
    (student.parent_email ?? "").trim() !== "" &&
    (student.parent_first_name ?? "").trim() !== "";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Dashboard
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {student.first_name} {student.last_name}
        </h1>
        <RecordStatusBadge status={parseRecordStatus(student.status)} />
      </div>
      <StudentTabs
        studentId={id}
        student={student}
        sessions={sessions}
        canSendWelcome={canSendWelcome}
        canResendWelcome={canResendWelcome}
        welcomeSentAtDisplay={welcomeSentAtDisplay}
        welcomeActions={
          <>
            {canSendWelcome && <SendWelcomeEmailButton studentId={id} />}
            {canResendWelcome && <SendWelcomeEmailButton studentId={id} variant="resend" />}
          </>
        }
      />
    </div>
  );
}
