import {
  RECORD_STATUSES,
  RECORD_STATUS_LABELS,
  type RecordStatus,
} from "@/lib/record-status";

type Props = {
  name?: string;
  value: RecordStatus;
  labelClassName?: string;
  selectClassName?: string;
};

export function RecordStatusField({
  name = "status",
  value,
  labelClassName = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300",
  selectClassName = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100",
}: Props) {
  return (
    <div>
      <label htmlFor={name} className={labelClassName}>
        Status
      </label>
      <select
        id={name}
        name={name}
        defaultValue={value}
        className={selectClassName}
      >
        {RECORD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {RECORD_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
