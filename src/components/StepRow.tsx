
import Link from "next/link";
import { getTool } from "@/lib/tools";
import type { WorkflowStep } from "@/db/schema";
import { ImpactBadge, StatusBadge } from "./badges";
import { ApiAction } from "./ApiAction";

function resultSummary(step: WorkflowStep): string | null {
  if (step.status !== "succeeded") return null;

  const r = (step.result ?? {}) as Record<string, unknown>;
  const parts: string[] = [];

  if (typeof r.messageId === "string")
    parts.push(`Confirmation number: ${r.messageId}`);

  if (typeof r.orderId === "string")
    parts.push(`Order number: ${r.orderId}`);

  if (typeof r.activationId === "string")
    parts.push(`Activation number: ${r.activationId}`);

  if (typeof r.ticket === "string")
    parts.push(`Reference number: ${r.ticket}`);

  if (typeof r.recipients === "number")
    parts.push(`${r.recipients.toLocaleString()} people notified`);

  if (Array.isArray(r.sheltersOpened))
    parts.push(`Shelters opened: ${r.sheltersOpened.join(", ")}`);

  if (Array.isArray(r.pagedTeams))
    parts.push(`Teams contacted: ${r.pagedTeams.join(", ")}`);

  return parts.join(" · ") || "Action completed successfully";
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
        active
          ? "border-blue-400 bg-blue-50/60"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-800 text-xs font-bold text-white">
          {step.position}
        </span>

        <span className="font-semibold text-slate-800">
          {step.name}
        </span>

        <ImpactBadge impact={impact} />

        {step.requiresApproval && (
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-800">
            Approval needed
          </span>
        )}

        <span className="ml-auto">
          <StatusBadge status={step.status} />
        </span>
      </div>

      {tool?.label && (
        <div className="mt-1 pl-8 text-xs text-slate-500">
          Service: {tool.label}
        </div>
      )}

      {summary && (
        <div className="mt-1 pl-8 text-xs text-emerald-700">
          ✓ {summary}
        </div>
      )}

      {step.status === "failed" && step.errorMessage && (
        <div className="mt-1 rounded bg-red-50 px-2 py-1 pl-8 text-xs text-red-700">
          ⚠ This action could not be completed: {step.errorMessage}
        </div>
      )}

      {step.approvalStatus === "approved" && step.approvedBy && (
        <div className="mt-1 pl-8 text-xs text-slate-500">
          Approved by {step.approvedBy}
          {step.approvalNote
            ? ` — "${step.approvalNote}"`
            : ""}
        </div>
      )}

      {step.approvalStatus === "rejected" && (
        <div className="mt-1 pl-8 text-xs text-slate-500">
          This action was rejected
          {step.approvalNote
            ? ` — "${step.approvalNote}"`
            : ""}
        </div>
      )}

      {step.attemptCount > 1 && step.status !== "pending" && (
        <div className="mt-1 pl-8 text-[11px] text-slate-400">
          Number of attempts: {step.attemptCount}
        </div>
      )}

      {/* Approval and recovery actions */}
      <div className="mt-2 space-y-2 pl-8">

        {step.status === "waiting" &&
          step.approvalStatus === "requested" && (
            <div className="rounded-md border border-violet-200 bg-violet-50 p-3">
              <p className="mb-1 text-sm font-semibold text-violet-900">
                Important Action — Approval Needed
              </p>

              <p className="mb-2 text-xs text-violet-800">
                Please review this action before allowing it to proceed.
                Your decision will be recorded.
              </p>

              <textarea
                id={noteId}
                rows={2}
                placeholder="Add a note (optional)"
                className="w-full rounded border border-violet-200 p-2 text-xs"
              />

              <div className="mt-2 flex flex-wrap gap-2">
                <ApiAction
                  url={`/api/steps/${step.id}/approve`}
                  body={{ back }}
                  gather={{ note: noteId }}
                  label="Approve and Continue"
                  variant="primary"
                />

                <ApiAction
                  url={`/api/steps/${step.id}/reject`}
                  body={{ back }}
                  gather={{ note: noteId }}
                  label="Reject Action"
                  variant="danger"
                  confirm="Are you sure you want to reject this action? Your decision will be recorded."
                />
              </div>
            </div>
          )}

        {step.status === "failed" && (
          <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
            <p className="mb-1 text-sm font-semibold text-orange-900">
              Action Needs Attention
            </p>

            <p className="mb-2 text-xs text-orange-800">
              This action was not completed. You can try again
              or continue without it by providing a reason.
            </p>

            <div className="flex flex-wrap gap-2">
              <ApiAction
                url={`/api/steps/${step.id}/retry`}
                body={{ back }}
                label="Try Again"
                variant="warn"
                title="Try this action again. Previously completed actions will be preserved."
              />

              <input
                id={reasonId}
                placeholder="Why are you skipping this action?"
                className="w-full max-w-xs rounded border border-slate-300 p-2 text-xs"
              />

              <ApiAction
                url={`/api/steps/${step.id}/skip`}
                body={{ back }}
                gather={{ reason: reasonId }}
                label="Continue Without This Action"
                variant="ghost"
                confirm="Are you sure? This action will be skipped and your reason will be recorded."
              />
            </div>
          </div>
        )}

        {step.evidenceId && (
          <Link
            href={`/evidence/${step.evidenceId}`}
            className="inline-block text-xs font-semibold text-blue-700 underline"
          >
            View Action Record →
          </Link>
        )}
      </div>
    </li>
  );
}
