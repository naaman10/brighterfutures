import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudentById } from "@/lib/db";
import { updateStudentAction } from "./actions";
import { EditStudentForm } from "./edit-student-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditStudentPage({ params }: Props) {
  const { id } = await params;
  const student = await getStudentById(id);
  if (!student) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/dashboard/students/${id}`}
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to student
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Update student details
      </h1>
      <EditStudentForm student={student} action={updateStudentAction} />
    </div>
  );
}
