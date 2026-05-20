import { MaterialSymbol } from "./material-symbol";

type Props = {
  className?: string;
};

/** Laptop icon for sessions with Google Meet (Material Symbol: laptop_mac). */
export function GoogleMeetCalendarIcon({ className = "text-[11px] md:text-xs" }: Props) {
  return (
    <span
      className="inline-flex shrink-0 align-middle text-zinc-600 dark:text-zinc-400"
      title="Google Meet"
      aria-label="Google Meet"
    >
      <MaterialSymbol name="laptop_mac" className={className} />
    </span>
  );
}
