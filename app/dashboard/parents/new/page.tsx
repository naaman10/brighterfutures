import Link from "next/link";
import { AddParentForm } from "./add-parent-form";

export default function NewParentPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Dashboard
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Add parent
      </h1>
      <AddParentForm />
    </div>
  );
}
