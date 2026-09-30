import {
  RECORD_STATUS_LABELS,
  type RecordStatus,
} from "@/lib/record-status";

type Props = {
  status: RecordStatus;
};

export function RecordStatusBadge({ status }: Props) {
  const inactive = status === "inactive";
  return (
    <span
      className={
        inactive
          ? "inline-flex rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
          : "inline-flex rounded-full bg-mint px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200"
      }
    >
      {RECORD_STATUS_LABELS[status]}
    </span>
  );
}
