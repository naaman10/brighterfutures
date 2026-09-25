import Link from "next/link";
import {
  bftLearnProgressStatusLabel,
  type BftLearnEnrollment,
} from "@/lib/bft-learn";

function displayValue(value: string): string {
  return value.trim() || "—";
}

type Props = {
  studentId: string;
  studentName: string;
  enrollment: BftLearnEnrollment;
  heading: string;
  description: string;
  currentCrumb: string;
};

export function EnrollmentIdentity({
  studentId,
  studentName,
  enrollment,
  heading,
  description,
  currentCrumb,
}: Props) {
  const title = enrollment.name.trim() || enrollment.entryId;

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
          {studentName}
        </Link>
        <span className="text-zinc-400 dark:text-zinc-500">/</span>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {currentCrumb}
        </span>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {heading}
        </h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Content
            </dt>
            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">{title}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Subject
            </dt>
            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
              {displayValue(enrollment.subject)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Year Group
            </dt>
            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
              {displayValue(enrollment.ageGroup)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Type
            </dt>
            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
              {displayValue(enrollment.type)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Progress
            </dt>
            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
              {bftLearnProgressStatusLabel(enrollment.progressStatus)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Student ID
            </dt>
            <dd className="mt-0.5 font-mono text-sm text-zinc-900 dark:text-zinc-50">
              {studentId}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Entry ID
            </dt>
            <dd className="mt-0.5 font-mono text-sm text-zinc-900 dark:text-zinc-50">
              {enrollment.entryId}
            </dd>
          </div>
          {enrollment.id ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Enrollment ID
              </dt>
              <dd className="mt-0.5 font-mono text-sm text-zinc-900 dark:text-zinc-50">
                {enrollment.id}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
