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
          ? "inline-flex rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
          : "inline-flex rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
      }
    >
      {RECORD_STATUS_LABELS[status]}
    </span>
  );
}
