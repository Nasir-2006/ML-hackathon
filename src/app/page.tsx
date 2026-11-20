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

  const activeIncidents = rows.filter((r) => r.incident.status === "active").length;
  const saved = Math.max(0, metrics.manualMinutes - metrics.avgAutomatedMinutes);
  const savedPct = metrics.manualMinutes
    ? Math.round((saved / metrics.manualMinutes) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-200">Emergency Operations</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Coordinated Incident Response</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              One dependable procedure replaces the same multi-step work staff repeat across
              disconnected tools. Consequential actions wait for human approval; failures pause for
              recovery; every high-impact output leaves evidence.
            </p>
          </div>
          <Link
            href="/incidents/new"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100"
          >
            + New incident
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Active incidents" value={String(activeIncidents)} />
        <Stat
          label="Awaiting approval"
          value={String(pending)}
          accent={pending > 0 ? "amber" : "slate"}
        />
        <Stat label="Procedures run" value={String(metrics.runs)} />
        <Stat
          label="Avg simulated time / procedure"
          value={fmtMinutes(metrics.avgAutomatedMinutes)}
          sub={metrics.completedRuns ? `${metrics.completedRuns} completed` : "no runs yet"}
        />
      </section>

      {/* Illustrative baseline vs simulated workflow output */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Reference baseline vs. Sentinel simulation</h2>
          <Link href="/metrics" className="text-sm font-semibold text-blue-700 hover:underline">
            Full impact report →
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Illustrative manual reference
            </p>
            <dl className="mt-2 space-y-1 text-sm text-slate-700">
              <Row k="Steps repeated by hand" v={`${metrics.manualSteps} steps`} />
              <Row k="Disconnected tools" v={`${metrics.manualTools} systems`} />
              <Row k="Reference duration" v={`${metrics.manualMinutes} min`} />
              <Row
                k="Illustrative errors / incident"
                v={metrics.manualErrors.toFixed(2)}
              />
            </dl>
            <p className="mt-2 text-[11px] text-slate-400">
              Source: {metrics.baseline?.source ?? "Illustrative demonstration fixture"}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Sentinel response (simulated)
            </p>
            <dl className="mt-2 space-y-1 text-sm text-slate-700">
              <Row k="Coordinated in one workflow" v={`${metrics.manualSteps} steps`} />
              <Row k="Avg simulated duration" v={fmtMinutes(metrics.avgAutomatedMinutes)} />
              <Row k="Fixture comparison" v={`${savedPct}% lower in sample runs`} />
              <Row k="Approvals enforced" v={`${metrics.approvalsPerformed}`} />
            </dl>
            <p className="mt-2 text-[11px] text-emerald-700">
              Timings and baseline values are illustrative demo fixtures, not audited field outcomes. High-impact outputs are gated and evidence-backed; partial failures recover in place.
            </p>
          </div>
        </div>
        {metrics.completedRuns === 0 && (
          <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
            No completed procedures yet — start a playbook to generate simulator timing data.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-slate-800">Incidents</h2>
        <div className="space-y-2">
          {rows.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              No incidents yet.{" "}
              <Link href="/incidents/new" className="font-semibold text-blue-700 underline">
                Create the first one
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
                    <span className="font-semibold text-slate-800">{incident.title}</span>
                    <StatusBadge status={incident.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {incident.reference} · {INCIDENT_TYPE_LABEL[incident.type] ?? incident.type} ·{" "}
                    {incident.location} · Sev {incident.severity} ({SEVERITY_LABEL[incident.severity]})
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {latest ? (
                    <StatusBadge status={latest.status} />
                  ) : (
                    <span className="text-slate-400">no procedure</span>
                  )}
                  <p className="mt-1">{timeAgo(incident.createdAt)}</p>
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
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          accent === "amber" ? "text-amber-600" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
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
