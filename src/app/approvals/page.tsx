
import Link from "next/link";
import { listApprovals } from "@/lib/queries";
import { getTool } from "@/lib/tools";
import { INCIDENT_TYPE_LABEL, timeAgo } from "@/lib/format";
import { StatusBadge, ImpactBadge } from "@/components/badges";
import { StepRow } from "@/components/StepRow";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const approvals = await listApprovals();

  return (
    <div className="space-y-5">

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Pending Decisions
        </h1>

        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Some emergency actions need approval before they can
          proceed. Review what each action will do, then approve
          or reject it. Your decision will be recorded.
        </p>
      </div>

      {/* Empty state */}
      {approvals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="text-3xl">✓</div>

          <p className="mt-2 font-semibold text-slate-800">
            No decisions are waiting.
          </p>

          <p className="mt-1 text-sm text-slate-500">
            All actions that needed approval have been handled.
          </p>

          <Link
            href="/incidents"
            className="mt-3 inline-block text-sm font-semibold text-blue-700 underline"
          >
            View Emergencies →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">

          <p className="text-sm font-semibold text-slate-700">
            {approvals.length} action
            {approvals.length === 1 ? "" : "s"} waiting for your decision
          </p>

          {approvals.map(({ step, workflow, incident }) => {
            const tool = getTool(step.tool);

            return (
              <div
                key={step.id}
                className="overflow-hidden rounded-2xl border border-violet-200 bg-white"
              >

                {/* Action heading */}
                <div className="flex flex-wrap items-center gap-2 border-b border-violet-100 bg-violet-50 px-4 py-3">
                  <ImpactBadge impact={tool?.impact ?? "low"} />

                  <span className="font-semibold text-violet-900">
                    {step.name}
                  </span>

                  <span className="ml-auto text-xs text-slate-500">
                    Waiting {timeAgo(step.lastAttemptAt ?? step.createdAt)}
                  </span>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2">

                  {/* Emergency information */}
                  <div className="text-sm text-slate-600">
                    <p className="font-semibold text-slate-800">
                      Related Emergency
                    </p>

                    {incident && (
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="text-blue-700 hover:underline"
                      >
                        {incident.title}
                      </Link>
                    )}

                    <p className="mt-1 text-xs text-slate-500">
                      {incident
                        ? `${incident.reference} · ${
                            INCIDENT_TYPE_LABEL[incident.type] ??
                            incident.type
                          }`
                        : "Emergency information unavailable"}
                    </p>

                    <div className="mt-3">
                      <p className="font-semibold text-slate-800">
                        Response Plan
                      </p>

                      <p>{workflow?.name ?? "Not available"}</p>

                      <div className="mt-1">
                        <StatusBadge
                          status={workflow?.status ?? ""}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action explanation */}
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="font-semibold text-slate-800">
                      What Will Happen?
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {tool?.description ??
                        "Review this action carefully before making your decision."}
                    </p>

                    <p className="mt-3 text-xs text-slate-500">
                      Please make sure this action is appropriate
                      for the current emergency before approving it.
                    </p>
                  </div>
                </div>

                {/* Approval controls */}
                <div className="border-t border-slate-100 px-4 py-3">
                  <p className="mb-2 text-sm font-semibold text-slate-800">
                    Your Decision
                  </p>

                  <StepRow
                    step={step}
                    incidentId={incident?.id ?? 0}
                    back="/approvals"
                    active
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
