
import Link from "next/link";
import { getMetrics } from "@/lib/workflow";
import { listIncidents, countPendingApprovals } from "@/lib/queries";
import {
  INCIDENT_TYPE_LABEL,
  SEVERITY_LABEL,
  fmtMinutes,
  timeAgo,
} from "@/lib/format";
import { StatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [rows, pending, metrics] = await Promise.all([
    listIncidents(),
    countPendingApprovals(),
    getMetrics(),
  ]);

  const activeIncidents = rows.filter(
    (r) => r.incident.status === "active"
  ).length;

  const saved = Math.max(
    0,
    metrics.manualMinutes - metrics.avgAutomatedMinutes
  );

  const savedPct = metrics.manualMinutes
    ? Math.round((saved / metrics.manualMinutes) * 100)
    : 0;

  return (
    <div className="space-y-6">

      {/* Welcome section */}
      <section className="rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-200">
              Emergency Management
            </p>

            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Emergency Response Center
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              Manage emergencies, coordinate response teams, and
              keep track of important actions from one place.
              Review important decisions, handle problems, and
              see what has been completed.
            </p>
          </div>

          <Link
            href="/incidents/new"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100"
          >
            + Report an Emergency
          </Link>
        </div>
      </section>

      {/* Overview cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Active Emergencies"
          value={String(activeIncidents)}
        />

        <Stat
          label="Decisions Needed"
          value={String(pending)}
          accent={pending > 0 ? "amber" : "slate"}
        />

        <Stat
          label="Response Plans Started"
          value={String(metrics.runs)}
        />

        <Stat
          label="Average Response Time"
          value={fmtMinutes(metrics.avgAutomatedMinutes)}
          sub={
            metrics.completedRuns
              ? `${metrics.completedRuns} completed responses`
              : "No completed responses yet"
          }
        />
      </section>

      {/* Response comparison */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">
            Response Time Comparison
          </h2>

          <Link
            href="/metrics"
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            View Full Results →
          </Link>
        </div>

        <div className="mt-2 text-sm text-slate-500">
          See how the example manual process compares with the
          automated response system.
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">

          {/* Manual response */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Example Manual Response
            </p>

            <dl className="mt-2 space-y-2 text-sm text-slate-700">
              <Row
                k="Steps handled manually"
                v={`${metrics.manualSteps} steps`}
              />

              <Row
                k="Different systems used"
                v={`${metrics.manualTools} systems`}
              />

              <Row
                k="Estimated time required"
                v={`${metrics.manualMinutes} min`}
              />

              <Row
                k="Estimated errors per emergency"
                v={metrics.manualErrors.toFixed(2)}
              />
            </dl>

            <p className="mt-3 text-[11px] text-slate-500">
              Based on:{" "}
              {metrics.baseline?.source ?? "Example demonstration data"}
            </p>
          </div>

          {/* Automated response */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Automated Response (Simulation)
            </p>

            <dl className="mt-2 space-y-2 text-sm text-slate-700">
              <Row
                k="Steps handled together"
                v={`${metrics.manualSteps} steps`}
              />

              <Row
                k="Average time taken"
                v={fmtMinutes(metrics.avgAutomatedMinutes)}
              />

              <Row
                k="Time reduction in sample runs"
                v={`${savedPct}%`}
              />

              <Row
                k="Approvals completed"
                v={String(metrics.approvalsPerformed)}
              />
            </dl>

            <p className="mt-3 text-[11px] text-emerald-800">
              These are example results from simulated responses,
              not verified real-world results. Important actions
              require approval, and failed steps can be addressed
              without restarting the entire response.
            </p>
          </div>
        </div>

        {metrics.completedRuns === 0 && (
          <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
            No completed responses yet. Start a response plan
            to see example response times here.
          </p>
        )}
      </section>

      {/* Recent emergencies */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-800">
          Recent Emergencies
        </h2>

        <div className="space-y-2">
          {rows.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              No emergencies have been reported yet.{" "}

              <Link
                href="/incidents/new"
                className="font-semibold text-blue-700 underline"
              >
                Report the first emergency
              </Link>
              .
            </p>
          )}

          {rows.map(({ incident, workflows: wfs }) => {
            const latest = wfs[0];

            return (
              <Link
                key={incident.id}
                href={`/incidents/${incident.id}`}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {incident.title}
                    </span>

                    <StatusBadge status={incident.status} />
                  </div>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {incident.reference} ·{" "}
                    {INCIDENT_TYPE_LABEL[incident.type] ?? incident.type} ·{" "}
                    {incident.location} ·{" "}
                    {SEVERITY_LABEL[incident.severity]}
                  </p>
                </div>

                <div className="text-right text-xs text-slate-500">
                  {latest ? (
                    <StatusBadge status={latest.status} />
                  ) : (
                    <span className="text-slate-400">
                      No response plan started
                    </span>
                  )}

                  <p className="mt-1">
                    {timeAgo(incident.createdAt)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent = "slate",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "slate" | "amber";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-bold ${
          accent === "amber" ? "text-amber-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>

      {sub && (
        <p className="text-[11px] text-slate-400">
          {sub}
        </p>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-semibold text-slate-800">{v}</dd>
    </div>
  );
}
