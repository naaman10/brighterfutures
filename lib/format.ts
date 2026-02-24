/**
 * Display formatters for consistent date/time across the app.
 * Dates: dd/mm/yyyy | Times: hh:mm (24-hour)
 */

type DateLike = string | Date | null | undefined;

function toDate(value: DateLike): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const d = new Date(String(value).slice(0, 19));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Format for display: dd/mm/yyyy */
export function formatDisplayDate(value: DateLike): string {
  const d = toDate(value);
  if (!d) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Format for display: hh:mm (24-hour) */
export function formatDisplayTime(value: DateLike): string {
  if (value == null || value === "") return "";
  const s = String(value).trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
    const [h, m] = s.split(":");
    return `${h!.padStart(2, "0")}:${m!.padStart(2, "0")}`;
  }
  const d = toDate(value);
  if (!d) return "";
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Format for display: dd/mm/yyyy hh:mm */
export function formatDisplayDateTime(value: DateLike): string {
  const d = toDate(value);
  if (!d) return "";
  return `${formatDisplayDate(d)} ${formatDisplayTime(d)}`;
}
