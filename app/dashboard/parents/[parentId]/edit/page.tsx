import Link from "next/link";
import { notFound } from "next/navigation";
import { getParentById } from "@/lib/db";
import { EditParentForm } from "./edit-parent-form";

type Props = { params: Promise<{ parentId: string }> };

export default async function EditParentPage({ params }: Props) {
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
        <span className="text-sm text-zinc-900 dark:text-zinc-50">{parentName}</span>
      </div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Edit parent
      </h1>
      <EditParentForm parent={parent} />
    </div>
  );
}
