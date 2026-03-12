import Link from "next/link";
import { notFound } from "next/navigation";
import { getParentById } from "@/lib/db";
import { AddStudentForm } from "./add-student-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ parentId: string }> };

export default async function AddStudentToParentPage({ params }: Props) {
  const { parentId } = await params;
  const parent = await getParentById(parentId);
  if (!parent) notFound();

  const parentName = [parent.first_name, parent.last_name].filter(Boolean).join(" ") || "Parent";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/parents"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Parents
        </Link>
        <span className="text-zinc-400 dark:text-zinc-500">/</span>
        <Link
          href="/dashboard/parents"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          {parentName}
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Add student to {parentName}
      </h1>
      <AddStudentForm parentId={parentId} />
    </div>
  );
}
