import Link from "next/link";
import { notFound } from "next/navigation";
import { getParentById, getStudentsByParentId } from "@/lib/db";
import { formatDisplayDate, formatDisplayTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ parentId: string }> };

export default async function ViewParentPage({ params }: Props) {
  const { parentId } = await params;
  const [parent, students] = await Promise.all([
    getParentById(parentId),
    getStudentsByParentId(parentId),
  ]);
  if (!parent) notFound();

  const parentName = [parent.first_name, parent.last_name].filter(Boolean).join(" ") || "Parent";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/parents"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Parents
          </Link>
          <span className="text-zinc-400 dark:text-zinc-500">/</span>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{parentName}</span>
        </div>
        <Link
          href={`/dashboard/parents/${parentId}/edit`}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Edit parent
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {parentName}
      </h1>

      <div className="mb-8 space-y-6">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Contact
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Email
              </dt>
              <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                {parent.email ?? "—"}
              </dd>
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
              <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                {parent.town ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Post code
              </dt>
              <dd className="mt-0.5 text-zinc-900 dark:text-zinc-50">
                {parent.post_code ?? "—"}
              </dd>
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
                {[parent.emergency_first_name, parent.emergency_last_name].filter(Boolean).join(" ") || "—"}
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

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
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
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {student.first_name} {student.last_name}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
                View student
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
