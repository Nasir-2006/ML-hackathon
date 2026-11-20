import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { incidents } from "@/db/schema";
import { getIncidentWithWorkflows } from "@/lib/queries";
import { PLAYBOOKS } from "@/lib/playbooks";
import {
  INCIDENT_TYPE_LABEL,
  SEVERITY_LABEL,
  fmtMinutes,
  minutesBetween,
  timeAgo,
} from "@/lib/format";
import { StatusBadge } from "@/components/badges";
import { StepRow } from "@/components/StepRow";

export const dynamic = "force-dynamic";

export default async function IncidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const incidentId = parseInt(id, 10);
  if (!incidentId) notFound();

  const data = await getIncidentWithWorkflows(incidentId);
  if (!data) notFound();
  const { incident, workflows, stepsByWf } = data;
  const back = `/incidents/${incident.id}`;

  const needsRecovery = workflows.some((w) => w.status === "needs_recovery");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/incidents" className="text-sm font-semibold text-blue-700 hover:underline">
          ← Incidents
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{incident.title}</h1>
              <StatusBadge status={incident.status} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {incident.reference} · {INCIDENT_TYPE_LABEL[incident.type] ?? incident.type} ·{" "}
              {incident.location}
              {incident.zone ? ` · ${incident.zone}` : ""}
            </p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <div>
              Severity <span className="font-bold text-slate-900">{incident.severity}</span> (
              {SEVERITY_LABEL[incident.severity]})
            </div>
            <div>
              Population at risk:{" "}
              <span className="font-bold text-slate-900">
                {incident.populationAtRisk?.toLocaleString() ?? "—"}
              </span>
            </div>
            <div className="text-xs text-slate-400">Declared {timeAgo(incident.createdAt)}</div>
          </div>
        </div>
      </section>

      {needsRecovery && (
        <div className="rounded-xl border border-orange-300 bg-orange-50 p-4 text-sm text-orange-900">
          <p className="font-semibold">⚠ Procedure paused for recovery</p>
          <p className="mt-1 text-orange-800">
            A tool action failed. Completed steps are preserved — use <strong>Retry</strong> to re-run
            only the failed step, or <strong>Skip</strong> it with a reason. If a tool is unavailable,
            restore it from the{" "}
            <Link href="/tools" className="font-semibold underline">
              Tools
            </Link>{" "}
            panel first.
          </p>
        </div>
      )}

      {/* Workflows */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Response procedures</h2>
          {workflows.some((w) => w.status === "awaiting_approval") && (
            <Link
              href="/approvals"
              className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-700"
            >
              Open approval queue →
            </Link>
          )}
        </div>

        {workflows.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            No procedure started yet. Launch a playbook below to coordinate the response.
          </p>
        )}

        {workflows.map((wf) => {
          const steps = stepsByWf[wf.id] ?? [];
          const activeStep = steps.find((s) => s.status === "pending" || s.status === "waiting");
          const dur = minutesBetween(wf.startedAt, wf.finishedAt);
          return (
            <div key={wf.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-800">{wf.name}</h3>
                <StatusBadge status={wf.status} />
                <span className="text-xs text-slate-400">
                  {steps.filter((s) => s.status === "succeeded").length}/{steps.length} steps done
                  {dur != null ? ` · ${fmtMinutes(dur)}` : ""}
                </span>
              </div>
              <ol className="mt-3 space-y-2">
                {steps.map((s) => (
                  <StepRow
                    key={s.id}
                    step={s}
                    incidentId={incident.id}
                    back={back}
                    active={activeStep?.id === s.id}
                  />
                ))}
              </ol>
            </div>
          );
        })}
      </section>

      {/* Launch another playbook */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-800">Launch another playbook</h2>
        <p className="mb-3 text-sm text-slate-600">
          Start an additional coordinated procedure for this incident.
        </p>
        <form action="/api/workflows" method="post" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="incidentId" value={incident.id} />
          <label className="flex-1">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Playbook</span>
            <select name="playbook" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {PLAYBOOKS.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} ({p.steps.length} steps)
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Start procedure
          </button>
        </form>
      </section>
    </div>
  );
}
