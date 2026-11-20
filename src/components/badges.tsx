
import { impactTone, statusTone } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  pending: "Not Started",
  running: "In Progress",
  waiting: "Waiting for Approval",
  awaiting_approval: "Decision Needed",
  succeeded: "Completed",
  completed: "Completed",
  failed: "Could Not Complete",
  needs_recovery: "Needs Attention",
  skipped: "Skipped",
  approved: "Approved",
  rejected: "Rejected",
  active: "Active",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

const IMPACT_LABELS: Record<string, string> = {
  low: "Low Impact",
  medium: "Medium Impact",
  high: "High Impact",
  critical: "Critical Action",
};

export function StatusBadge({ status }: { status: string }) {
  const label =
    STATUS_LABELS[status] ??
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusTone(
        status,
      )}`}
    >
      {label}
    </span>
  );
}

export function ImpactBadge({ impact }: { impact: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${impactTone(
        impact,
      )}`}
    >
      {IMPACT_LABELS[impact] ?? impact.replace(/_/g, " ")}
    </span>
  );
}
