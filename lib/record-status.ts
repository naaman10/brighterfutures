export type RecordStatus = "active" | "inactive";

export const RECORD_STATUSES: RecordStatus[] = ["active", "inactive"];

export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export function parseRecordStatus(
  value: string | null | undefined
): RecordStatus {
  return value === "inactive" ? "inactive" : "active";
}
