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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Approval queue</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Every consequential action (evacuation orders, mass SMS, utility shutoffs, public posts)
          pauses here for human review <strong>before</strong> it executes. Approving records the
          approver and generates an evidence record; rejecting logs the reason. This is the
          human-in-the-loop control path for high-impact outputs.
        </p>
      </div>

      {approvals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">No actions awaiting approval right now.</p>
          <Link href="/incidents" className="mt-2 inline-block text-sm font-semibold text-blue-700 underline">
            View active incidents →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map(({ step, workflow, incident }) => {
            const tool = getTool(step.tool);
            return (
              <div key={step.id} className="overflow-hidden rounded-2xl border border-violet-200 bg-white">
                <div className="flex flex-wrap items-center gap-2 border-b border-violet-100 bg-violet-50 px-4 py-2">
                  <ImpactBadge impact={tool?.impact ?? "low"} />
                  <span className="font-semibold text-violet-900">{step.name}</span>
                  <span className="text-xs text-violet-700">{tool?.label}</span>
                  <span className="ml-auto text-xs text-slate-500">
                    queued {timeAgo(step.lastAttemptAt ?? step.createdAt)}
                  </span>
                </div>
                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  <div className="text-sm text-slate-600">
                    <p className="font-semibold text-slate-800">Incident</p>
                    {incident && (
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="text-blue-700 hover:underline"
                      >
                        {incident.title}
                      </Link>
                    )}
                    <p className="text-xs text-slate-500">
                      {incident
                        ? `${incident.reference} · ${INCIDENT_TYPE_LABEL[incident.type] ?? incident.type}`
                        : "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Procedure: {workflow?.name ?? "—"} · <StatusBadge status={workflow?.status ?? ""} />
                    </p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p className="font-semibold text-slate-800">What this will do</p>
                    <p className="text-xs text-slate-600">{tool?.description}</p>
                    <pre className="mt-2 max-h-32 overflow-auto rounded bg-slate-50 p-2 text-[11px] text-slate-600">
                      {JSON.stringify(step.params, null, 2)}
                    </pre>
                  </div>
                </div>
                <div className="border-t border-slate-100 px-4 py-3">
                  <StepRow step={step} incidentId={incident?.id ?? 0} back="/approvals" active />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
