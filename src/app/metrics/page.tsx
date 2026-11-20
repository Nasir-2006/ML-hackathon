import Link from "next/link";
import { getMetrics } from "@/lib/workflow";
import { getWorkflowRuns } from "@/lib/queries";
import {
  fmtMinutes,
  INCIDENT_TYPE_LABEL,
} from "@/lib/format";
import { StatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  const [metrics, runRows] = await Promise.all([getMetrics(), getWorkflowRuns()]);

  const saved = Math.max(0, metrics.manualMinutes - metrics.avgAutomatedMinutes);
  const savedPct = metrics.manualMinutes
    ? Math.round((saved / metrics.manualMinutes) * 100)
    : 0;
  const manualBar = 100;
  const autoBar = metrics.manualMinutes
    ? Math.max(4, Math.round((metrics.avgAutomatedMinutes / metrics.manualMinutes) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Impact & evaluation metrics</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          This page demonstrates how Sentinel records a comparison between a manual reference baseline and completed workflows. The seeded baseline and sample durations are illustrative fixtures—not audited municipal data or verified field outcomes. Replace them with an approved time study before making real-world impact claims.
        </p>
      </div>

      {/* Headline comparison */}
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Completion time (demo fixtures)"
          baseline={`${metrics.manualMinutes} min reference`}
          measured={`${fmtMinutes(metrics.avgAutomatedMinutes)} simulated avg`}
          delta={savedPct > 0 ? `${savedPct}% lower in sample runs` : "No completed sample yet"}
          good
        />
        <MetricCard
          label="Tools / systems touched"
          baseline={`${metrics.manualTools} disconnected`}
          measured="1 coordinated"
          delta="consolidated"
          good
        />
        <MetricCard
          label="Error-rate evidence"
          baseline={`${metrics.manualErrors.toFixed(2)} illustrative`}
          measured="Not measured in demo"
          delta="requires field validation"
        />
      </section>

      {/* Bar comparison */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-800">Reference duration vs. simulator sample duration</h2>
        <div className="mt-4 space-y-4">
          <Bar label="Illustrative manual reference" value={metrics.manualMinutes} pct={manualBar} tone="bg-slate-400" />
          <Bar
            label="Sentinel (simulated sample avg)"
            value={Math.round(metrics.avgAutomatedMinutes * 10) / 10}
            pct={autoBar}
            tone="bg-emerald-500"
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Illustrative reference: {metrics.manualMinutes} min across {metrics.manualSteps} repeated steps on{" "}
          {metrics.manualTools} systems. Simulated duration: average of {metrics.completedRuns} completed
          fixture procedure(s). Source: {metrics.baseline?.source ?? "demonstration benchmark fixture"}.
        </p>
      </section>

      {/* Methodology + human-review path */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-800">Why this is dependable</h2>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            <li>
              <span className="font-semibold text-slate-800">Coordinated tool use</span> — every step
              calls the right system in the right order from one procedure.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Recovery from partial failure</span> — a
              failed tool pauses the workflow; completed steps are kept and only the failed step is
              retried or skipped with a reason.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Approval before consequential actions</span>{" "}
              — evacuation orders, mass SMS, utility shutoffs and public posts wait for a human.
            </li>
            <li>
              <span className="font-semibold text-slate-800">Evidence for every high-impact output</span>{" "}
              — each consequential action writes a tamper-evident record (who, what, approver, receipt).
            </li>
            <li>
              <span className="font-semibold text-slate-800">Low-bandwidth & offline</span> — server-
              rendered HTML, minimal JS, cached app shell, and an offline action queue.
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-800">Evidence & human review</h2>
          <p className="mt-1 text-sm text-slate-600">
            {metrics.approvalsPerformed} approval(s) enforced and{" "}
            <Link href="/evidence" className="font-semibold text-blue-700 underline">
              {await evidenceCount()} high-impact output(s)
            </Link>{" "}
            recorded with full evidence. Every consequential action is reviewable after the fact.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Tally label="Procedures" value={metrics.runs} />
            <Tally label="Completed" value={metrics.completedRuns} />
            <Tally label="Failed steps" value={metrics.failedSteps} />
          </div>
          <Link
            href="/approvals"
            className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
          >
            Open the approval queue →
          </Link>
        </div>
      </section>

      {/* Per-run table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-800">Workflow run history · seeded examples are simulated</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Incident</th>
                <th className="px-3 py-2">Procedure</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Steps</th>
                <th className="px-3 py-2">Approvals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                    No procedures run yet.
                  </td>
                </tr>
              )}
              {runRows.map((r) => (
                <tr key={r.wfId} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link href={`/incidents/${r.incidentId}`} className="font-semibold text-slate-800 hover:underline">
                      {r.incidentTitle}
                    </Link>
                    <div className="text-xs text-slate-400">
                      {r.incidentRef} · {INCIDENT_TYPE_LABEL[r.incidentType] ?? r.incidentType}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{r.wfName}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2 text-slate-600">{fmtMinutes(r.dur)}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {r.done}/{r.total}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{r.approvals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

async function evidenceCount(): Promise<number> {
  const { db } = await import("@/db");
  const { evidence } = await import("@/db/schema");
  const { sql } = await import("drizzle-orm");
  const rows = await db.select({ c: sql<number>`count(*)` }).from(evidence);
  return Number(rows[0]?.c ?? 0);
}

function MetricCard({
  label,
  baseline,
  measured,
  delta,
  good,
}: {
  label: string;
  baseline: string;
  measured: string;
  delta: string;
  good?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-900">{measured}</p>
      <p className="text-xs text-slate-500">baseline: {baseline}</p>
      <p className={`mt-1 text-sm font-semibold ${good ? "text-emerald-600" : "text-slate-600"}`}>
        {delta}
      </p>
    </div>
  );
}

function Bar({ label, value, pct, tone }: { label: string; value: number; pct: number; tone: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-semibold">{value} min</span>
      </div>
      <div className="mt-1 h-4 w-full rounded bg-slate-100">
        <div className={`h-4 rounded ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Tally({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <div className="text-xl font-bold text-slate-900">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}
