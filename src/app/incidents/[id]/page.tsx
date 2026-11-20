
import Link from "next/link";
import { notFound } from "next/navigation";
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

  const needsRecovery = workflows.some(
    (w) => w.status === "needs_recovery"
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/incidents"
          className="text-sm font-semibold text-blue-700 hover:underline"
        >
          ← Back to Emergencies
        </Link>
      </div>

      {/* Emergency information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {incident.title}
              </h1>

              <StatusBadge status={incident.status} />
            </div>

            <p className="mt-1 text-sm text-slate-600">
              {incident.reference} ·{" "}
              {INCIDENT_TYPE_LABEL[incident.type] ?? incident.type} ·{" "}
              {incident.location}
              {incident.zone ? ` · ${incident.zone}` : ""}
            </p>
          </div>

          <div className="text-right text-sm text-slate-600">
            <div>
              Priority:{" "}
              <span className="font-bold text-slate-900">
                {SEVERITY_LABEL[incident.severity] ??
                  `Level ${incident.severity}`}
              </span>
            </div>

            <div>
              Estimated people affected:{" "}
              <span className="font-bold text-slate-900">
                {incident.populationAtRisk?.toLocaleString() ?? "Not provided"}
              </span>
            </div>

            <div className="text-xs text-slate-400">
              Reported {timeAgo(incident.createdAt)}
            </div>
          </div>
        </div>
      </section>

      {/* Recovery message */}
      {needsRecovery && (
        <div className="rounded-xl border border-orange-300 bg-orange-50 p-4 text-sm text-orange-900">
          <p className="font-semibold">
            ⚠ Response paused — an action needs attention
          </p>

          <p className="mt-1 text-orange-800">
            One of the actions could not be completed. Previously
            completed actions have been saved. You can try the failed
            action again or continue without it by providing a reason.

            If a connected service is unavailable, check the{" "}
            <Link
              href="/tools"
              className="font-semibold underline"
            >
              Connected Services
            </Link>{" "}
            page.
          </p>
        </div>
      )}

      {/* Response plans */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-800">
            Response Plans
          </h2>

          {workflows.some(
            (w) => w.status === "awaiting_approval"
          ) && (
            <Link
              href="/approvals"
              className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-700"
            >
              View Pending Decisions →
            </Link>
          )}
        </div>

        {workflows.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            No response plan has been started yet. Choose a plan
            below to organize the emergency response.
          </p>
        )}

        {workflows.map((wf) => {
          const steps = stepsByWf[wf.id] ?? [];

          const activeStep = steps.find(
            (s) =>
              s.status === "pending" ||
              s.status === "waiting"
          );

          const dur = minutesBetween(
            wf.startedAt,
            wf.finishedAt
          );

          const completedSteps = steps.filter(
            (s) => s.status === "succeeded"
          ).length;

          return (
            <div
              key={wf.id}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-800">
                  {wf.name}
                </h3>

                <StatusBadge status={wf.status} />

                <span className="text-xs text-slate-400">
                  {completedSteps} of {steps.length} actions completed
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

      {/* Start another response plan */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-800">
          Start Another Response Plan
        </h2>

        <p className="mb-3 text-sm text-slate-600">
          Choose another plan if additional help or actions are
          needed for this emergency.
        </p>

        <form
          action="/api/workflows"
          method="post"
          className="flex flex-wrap items-end gap-3"
        >
          <input
            type="hidden"
            name="incidentId"
            value={incident.id}
          />

          <label className="flex-1">
            <span className="mb-1 block text-sm font-semibold text-slate-700">
              Select a Response Plan
            </span>

            <select
              name="playbook"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {PLAYBOOKS.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} ({p.steps.length} actions)
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Start Response Plan
          </button>
        </form>
      </section>
    </div>
  );
}
