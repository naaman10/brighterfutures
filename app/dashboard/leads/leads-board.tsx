"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sendLeadOnboardingAction, updateLeadStatusAction } from "./actions";

type KanbanStatus = "new" | "in_progress" | "closed";
type Lead = Record<string, unknown>;

const STATUSES: KanbanStatus[] = ["new", "in_progress", "closed"];

function formatCellValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value || "—";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function prettifyHeader(key: string): string {
  return key.replace(/_/g, " ");
}

function normalizeStatus(value: unknown): KanbanStatus {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "closed") return "closed";
  if (raw === "in progress" || raw === "in_progress" || raw === "inprogress") {
    return "in_progress";
  }
  return "new";
}

function getLeadTitle(lead: Lead): string {
  const fullName = String(lead.full_name ?? "").trim();
  if (fullName) return fullName;
  const firstName = String(lead.first_name ?? "").trim();
  const lastName = String(lead.last_name ?? "").trim();
  if (firstName || lastName) return `${firstName} ${lastName}`.trim();
  const name = String(lead.name ?? "").trim();
  if (name) return name;
  return "Untitled lead";
}

function getLeadEmail(lead: Lead): string {
  return String(lead.contact_email ?? lead.email ?? "").trim() || "—";
}

function getStatusLabel(status: KanbanStatus): string {
  if (status === "in_progress") return "In Progress";
  if (status === "closed") return "Closed";
  return "New";
}

function leadStatusBadgeClass(status: KanbanStatus): string {
  switch (status) {
    case "in_progress":
      return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200";
    case "closed":
      return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
    default:
      return "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200";
  }
}

function formatCreatedAt(value: unknown): string {
  if (value == null) return "—";
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/London",
    }).format(value);
  }
  if (typeof value === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (m) {
      const [, y, mo, d] = m;
      return `${d}/${mo}/${y}`;
    }
    return value || "—";
  }
  if (typeof value === "number") {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/London",
    }).format(d);
  }
  return "—";
}

function LeadDetailModal({
  lead,
  columnStatus,
  onClose,
  sendingOnboardingId,
  onSendOnboarding,
}: {
  lead: Lead;
  columnStatus: KanbanStatus;
  onClose: () => void;
  sendingOnboardingId: string | null;
  onSendOnboarding: (leadId: string) => void;
}) {
  const leadId = String(lead.id ?? "");
  const displayFields = Object.entries(lead).sort(([a], [b]) => a.localeCompare(b));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="lead-modal-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {getLeadTitle(lead)}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{getLeadEmail(lead)}</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Status: {getStatusLabel(columnStatus)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-zinc-300 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Close
          </button>
        </div>

        {columnStatus === "in_progress" && leadId && (
          <div className="mb-4">
            <button
              type="button"
              disabled={sendingOnboardingId === leadId}
              onClick={() => onSendOnboarding(leadId)}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {sendingOnboardingId === leadId ? "Sending…" : "Send onboarding"}
            </button>
          </div>
        )}

        <dl className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          {displayFields.map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {prettifyHeader(key)}
              </dt>
              <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-50">
                {key === "created_at" ? formatCreatedAt(value) : formatCellValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

type Props = {
  initialLeads: Lead[];
};

export function LeadsBoard({ initialLeads }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sendingOnboardingId, setSendingOnboardingId] = useState<string | null>(null);
  const [onboardingNotice, setOnboardingNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );
  const [modalLeadId, setModalLeadId] = useState<string | null>(null);
  /** After a drag ends, the same card often receives a click — ignore that one open. */
  const suppressClickLeadIdRef = useRef<string | null>(null);

  const grouped = useMemo(() => {
    const out: Record<KanbanStatus, Lead[]> = {
      new: [],
      in_progress: [],
      closed: [],
    };
    for (const lead of leads) out[normalizeStatus(lead.status)].push(lead);
    return out;
  }, [leads]);

  const modalLead = useMemo(() => {
    if (!modalLeadId) return null;
    return leads.find((l) => String(l.id ?? "") === modalLeadId) ?? null;
  }, [leads, modalLeadId]);

  const modalColumnStatus = useMemo((): KanbanStatus | null => {
    if (!modalLead) return null;
    return normalizeStatus(modalLead.status);
  }, [modalLead]);

  useEffect(() => {
    if (modalLeadId && !modalLead) setModalLeadId(null);
  }, [modalLeadId, modalLead]);

  async function moveLead(leadId: string, targetStatus: KanbanStatus) {
    setSaveError(null);
    const current = leads.find((l) => String(l.id ?? "") === leadId);
    if (!current) return;
    const previousStatus = normalizeStatus(current.status);
    if (previousStatus === targetStatus) return;

    setLeads((prev) =>
      prev.map((l) => (String(l.id ?? "") === leadId ? { ...l, status: targetStatus } : l))
    );
    setSavingId(leadId);

    const result = await updateLeadStatusAction(leadId, targetStatus);
    if (result?.error) {
      setLeads((prev) =>
        prev.map((l) =>
          String(l.id ?? "") === leadId ? { ...l, status: previousStatus } : l
        )
      );
      setSaveError(result.error);
    }
    setSavingId(null);
  }

  async function handleSendOnboarding(leadId: string) {
    setOnboardingNotice(null);
    setSendingOnboardingId(leadId);
    const result = await sendLeadOnboardingAction(leadId);
    setSendingOnboardingId(null);
    if (result?.error) {
      setOnboardingNotice({ kind: "err", text: result.error });
    } else {
      setOnboardingNotice({ kind: "ok", text: "Onboarding email sent." });
    }
  }

  return (
    <div>
      {onboardingNotice && (
        <div
          className={`mb-3 rounded-lg border p-3 text-sm ${
            onboardingNotice.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
              : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
          }`}
        >
          {onboardingNotice.text}
        </div>
      )}
      {saveError && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {saveError}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        {STATUSES.map((status) => (
          <section
            key={status}
            className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const leadId =
                e.dataTransfer.getData("text/plain") ||
                e.dataTransfer.getData("text/lead-id");
              if (!leadId) return;
              void moveLead(leadId, status);
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
                {getStatusLabel(status)}
              </h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {grouped[status].length}
              </span>
            </div>
            <div className="space-y-3">
              {grouped[status].length === 0 ? (
                <p className="rounded border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  No leads
                </p>
              ) : (
                grouped[status].map((lead, idx) => {
                  const leadId = String(lead.id ?? "");
                  const canDrag = leadId.length > 0;
                  const cardStatus = normalizeStatus(lead.status);
                  const statusLabel = getStatusLabel(cardStatus);

                  return (
                    <article
                      key={leadId || `${status}-${idx}`}
                      role="button"
                      tabIndex={0}
                      draggable={canDrag}
                      aria-label={`Lead ${getLeadTitle(lead)}, status ${statusLabel}. Click for details, drag to move column.`}
                      onDragStart={(e) => {
                        if (!canDrag) return;
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", leadId);
                        e.dataTransfer.setData("text/lead-id", leadId);
                      }}
                      onDragEnd={() => {
                        if (!leadId) return;
                        suppressClickLeadIdRef.current = leadId;
                        window.setTimeout(() => {
                          if (suppressClickLeadIdRef.current === leadId) {
                            suppressClickLeadIdRef.current = null;
                          }
                        }, 200);
                      }}
                      onClick={() => {
                        if (!leadId) return;
                        if (suppressClickLeadIdRef.current === leadId) {
                          suppressClickLeadIdRef.current = null;
                          return;
                        }
                        setModalLeadId(leadId);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (leadId) setModalLeadId(leadId);
                        }
                      }}
                      className={`rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-left outline-none transition-colors hover:bg-zinc-100/80 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500 ${
                        canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default opacity-90"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {getLeadTitle(lead)}
                          {savingId === leadId ? (
                            <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                              Saving...
                            </span>
                          ) : null}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${leadStatusBadgeClass(cardStatus)}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                        {getLeadEmail(lead)}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        ))}
      </div>

      {modalLead && modalColumnStatus != null && (
        <LeadDetailModal
          lead={modalLead}
          columnStatus={modalColumnStatus}
          onClose={() => setModalLeadId(null)}
          sendingOnboardingId={sendingOnboardingId}
          onSendOnboarding={(id) => void handleSendOnboarding(id)}
        />
      )}
    </div>
  );
}
