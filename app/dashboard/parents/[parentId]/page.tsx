import Link from "next/link";
import { notFound } from "next/navigation";
import { getParentById, getStudentsByParentId } from "@/lib/db";
import { RecordStatusBadge } from "@/app/dashboard/components/record-status-badge";
import { parseRecordStatus } from "@/lib/record-status";
import { ParentTabs } from "./parent-tabs";

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
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/parents"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Parents
        </Link>
        <span className="text-zinc-400 dark:text-zinc-500">/</span>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{parentName}</span>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{parentName}</h1>
        <RecordStatusBadge status={parseRecordStatus(parent.status)} />
      </div>

      <ParentTabs parentId={parentId} parent={parent} students={students} />
    </div>
  );
}
