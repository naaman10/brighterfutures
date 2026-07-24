"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ParentBasic } from "@/lib/db";
import { RecordStatusField } from "@/app/dashboard/components/record-status-field";
import { parseRecordStatus } from "@/lib/record-status";
import { updateParentAction } from "../actions";

type EditParentFormProps = {
  parent: ParentBasic;
};

export function EditParentForm({ parent }: EditParentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setError(null);

    const newStatus = parseRecordStatus(formData.get("status") as string);
    const wasActive = parseRecordStatus(parent.status) === "active";
    const isDeactivating = wasActive && newStatus === "inactive";

    setPending(true);
    const toastId = toast.loading(
      isDeactivating
        ? "Saving parent and updating students & sessions…"
        : "Saving parent…"
    );

    try {
      const result = await updateParentAction(parent.id, formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error, { id: toastId });
        return;
      }

      if (result.deactivated) {
        const { studentsUpdated, sessionsCancelled } = result.deactivated;
        toast.success(
          `Parent saved. ${studentsUpdated} student${studentsUpdated !== 1 ? "s" : ""} set inactive and ${sessionsCancelled} upcoming session${sessionsCancelled !== 1 ? "s" : ""} cancelled.`,
          { id: toastId }
        );
      } else if (newStatus === "active" && parseRecordStatus(parent.status) === "inactive") {
        toast.success("Parent saved and set to active.", { id: toastId });
      } else {
        toast.success("Parent saved.", { id: toastId });
      }

      router.push("/dashboard/parents");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save parent.";
      setError(message);
      toast.error(message, { id: toastId });
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100";
  const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <form action={handleSubmit} className="max-w-md space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label htmlFor="first_name" className={labelClass}>
            First name *
          </label>
          <input
            id="first_name"
            name="first_name"
            required
            defaultValue={parent.first_name ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="last_name" className={labelClass}>
            Last name *
          </label>
          <input
            id="last_name"
            name="last_name"
            required
            defaultValue={parent.last_name ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={parent.email ?? ""}
            className={inputClass}
          />
        </div>
        <RecordStatusField
          value={parseRecordStatus(parent.status)}
          labelClassName={labelClass}
          selectClassName={inputClass}
        />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Contact
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="contact_number" className={labelClass}>
              Contact number
            </label>
            <input
              id="contact_number"
              name="contact_number"
              type="tel"
              defaultValue={parent.contact_number ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="secondary_contact_number" className={labelClass}>
              Secondary contact number
            </label>
            <input
              id="secondary_contact_number"
              name="secondary_contact_number"
              type="tel"
              defaultValue={parent.secondary_contact_number ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="relationship" className={labelClass}>
              Relationship
            </label>
            <input
              id="relationship"
              name="relationship"
              defaultValue={parent.relationship ?? ""}
              placeholder="e.g. Mother, Father, Guardian"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="session_rate" className={labelClass}>
              Session rate (£)
            </label>
            <input
              id="session_rate"
              name="session_rate"
              type="number"
              min={0}
              step={0.01}
              placeholder="e.g. 45"
              defaultValue={parent.session_rate ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Address
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="address_line_1" className={labelClass}>
              Address line 1
            </label>
            <input
              id="address_line_1"
              name="address_line_1"
              defaultValue={parent.address_line_1 ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="address_line_2" className={labelClass}>
              Address line 2
            </label>
            <input
              id="address_line_2"
              name="address_line_2"
              defaultValue={parent.address_line_2 ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="town" className={labelClass}>
              Town
            </label>
            <input
              id="town"
              name="town"
              defaultValue={parent.town ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="post_code" className={labelClass}>
              Post code
            </label>
            <input
              id="post_code"
              name="post_code"
              defaultValue={parent.post_code ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Emergency contact
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="emergency_first_name" className={labelClass}>
              First name
            </label>
            <input
              id="emergency_first_name"
              name="emergency_first_name"
              defaultValue={parent.emergency_first_name ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="emergency_last_name" className={labelClass}>
              Last name
            </label>
            <input
              id="emergency_last_name"
              name="emergency_last_name"
              defaultValue={parent.emergency_last_name ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="emergency_relation" className={labelClass}>
              Relationship
            </label>
            <input
              id="emergency_relation"
              name="emergency_relation"
              defaultValue={parent.emergency_relation ?? ""}
              placeholder="e.g. Grandparent, Aunt"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="emergency_contact" className={labelClass}>
              Contact number
            </label>
            <input
              id="emergency_contact"
              name="emergency_contact"
              type="tel"
              defaultValue={parent.emergency_contact ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <Link
          href="/dashboard/parents"
          aria-disabled={pending}
          className={`rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 ${pending ? "pointer-events-none opacity-50" : ""}`}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
