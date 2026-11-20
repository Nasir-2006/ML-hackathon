import Link from "next/link";
import { getTool } from "@/lib/tools";
import type { WorkflowStep } from "@/db/schema";
import { ImpactBadge, StatusBadge } from "./badges";
import { ApiAction } from "./ApiAction";

function resultSummary(step: WorkflowStep): string | null {
  if (step.status !== "succeeded") return null;
  const r = (step.result ?? {}) as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof r.messageId === "string") parts.push(`receipt ${r.messageId}`);
  if (typeof r.orderId === "string") parts.push(`order ${r.orderId}`);
  if (typeof r.activationId === "string") parts.push(`activation ${r.activationId}`);
  if (typeof r.ticket === "string") parts.push(`ticket ${r.ticket}`);
  if (typeof r.recipients === "number") parts.push(`${r.recipients.toLocaleString()} recipients`);
  if (typeof r.sheltersOpened !== "undefined")
    parts.push(`shelters: ${(r.sheltersOpened as unknown[]).join(", ")}`);
  if (typeof r.pagedTeams !== "undefined")
    parts.push(`paged: ${(r.pagedTeams as unknown[]).join(", ")}`);
  return parts.join(" · ") || "completed";
}

export function StepRow({
  step,
  incidentId,
  back,
  active,
}: {
  step: WorkflowStep;
  incidentId: number;
  back: string;
  active: boolean;
}) {
  const tool = getTool(step.tool);
  const impact = tool?.impact ?? "low";
  const summary = resultSummary(step);
  const noteId = `note-${step.id}`;
  const reasonId = `reason-${step.id}`;

  return (
    <li
      className={`rounded-lg border p-3 ${
        active ? "border-blue-400 bg-blue-50/60" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-800 text-xs font-bold text-white">
          {step.position}
        </span>
        <span className="font-semibold text-slate-800">{step.name}</span>
        <ImpactBadge impact={impact} />
        {step.requiresApproval && (
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-800">
            needs approval
          </span>
        )}
        <span className="ml-auto">
          <StatusBadge status={step.status} />
        </span>
      </div>

      <div className="mt-1 pl-8 text-xs text-slate-500">{tool?.label}</div>

      {summary && <div className="mt-1 pl-8 text-xs text-emerald-700">✓ {summary}</div>}
      {step.status === "failed" && step.errorMessage && (
        <div className="mt-1 rounded bg-red-50 px-2 py-1 pl-8 text-xs text-red-700">
          ⚠ {step.errorMessage}
        </div>
      )}
      {step.approvalStatus === "approved" && step.approvedBy && (
        <div className="mt-1 pl-8 text-xs text-slate-500">
          Approved by {step.approvedBy}
          {step.approvalNote ? ` — “${step.approvalNote}”` : ""}
        </div>
      )}
      {step.approvalStatus === "rejected" && (
        <div className="mt-1 pl-8 text-xs text-slate-500">
          Rejected{step.approvalNote ? ` — “${step.approvalNote}”` : ""}
        </div>
      )}
      {step.attemptCount > 1 && step.status !== "pending" && (
        <div className="mt-1 pl-8 text-[11px] text-slate-400">
          attempts: {step.attemptCount}
        </div>
      )}

      {/* Human-review + recovery controls */}
      <div className="mt-2 space-y-2 pl-8">
        {step.status === "waiting" && step.approvalStatus === "requested" && (
          <div className="rounded-md border border-violet-200 bg-violet-50 p-2">
            <p className="mb-1 text-xs font-semibold text-violet-800">
              Consequential action — human approval required
            </p>
            <textarea
              id={noteId}
              rows={2}
              placeholder="Review note (optional, recorded as evidence)"
              className="w-full rounded border border-violet-200 p-1.5 text-xs"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <ApiAction
                url={`/api/steps/${step.id}/approve`}
                body={{ back }}
                gather={{ note: noteId }}
                label="Approve & execute"
                variant="primary"
              />
              <ApiAction
                url={`/api/steps/${step.id}/reject`}
                body={{ back }}
                gather={{ note: noteId }}
                label="Reject"
                variant="danger"
                confirm="Reject this consequential action? It will be skipped and logged."
              />
            </div>
          </div>
        )}

        {step.status === "failed" && (
          <div className="rounded-md border border-orange-200 bg-orange-50 p-2">
            <p className="mb-1 text-xs font-semibold text-orange-800">Recovery path</p>
            <div className="flex flex-wrap gap-2">
              <ApiAction
                url={`/api/steps/${step.id}/retry`}
                body={{ back }}
                label="Retry this step"
                variant="warn"
                title="Re-run only this step; all completed work is preserved."
              />
              <input id={reasonId} placeholder="Reason to skip (required)" className="w-48 rounded border border-slate-300 p-1.5 text-xs" />
              <ApiAction
                url={`/api/steps/${step.id}/skip`}
                body={{ back }}
                gather={{ reason: reasonId }}
                label="Skip step"
                variant="ghost"
                confirm="Skip this step? The reason will be recorded in the audit trail."
              />
            </div>
          </div>
        )}

        {step.evidenceId && (
          <Link
            href={`/evidence/${step.evidenceId}`}
            className="inline-block text-xs font-semibold text-blue-700 underline"
          >
            View evidence →
          </Link>
        )}
      </div>
    </li>
  );
}
