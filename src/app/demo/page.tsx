import Link from "next/link";
import { getMetrics } from "@/lib/workflow";
import { listIncidents } from "@/lib/queries";
import { fmtMinutes } from "@/lib/format";
import { StatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const [rows, metrics] = await Promise.all([listIncidents(), getMetrics()]);
  const recoveryCase = rows.find(({ workflows }) =>
    workflows.some((workflow) => workflow.status === "needs_recovery"),
  );
  const completedCase = rows.find(({ workflows }) =>
    workflows.some((workflow) => workflow.status === "completed"),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-2xl bg-slate-900 p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
          Guided product demo · simulated tools only
        </p>
        <h1 className="mt-2 text-3xl font-bold">Sentinel in 90 seconds</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Follow one incident from coordinated response through a simulated partial failure, human
          approval, evidence capture, and measured impact. No message, evacuation order, or utility
          action is sent to a real system.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={recoveryCase ? `/incidents/${recoveryCase.incident.id}` : "/incidents/new"}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
          >
            {recoveryCase ? "Open recovery scenario" : "Create a demo incident"}
          </Link>
          <Link
            href="/metrics"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            View evaluation metrics
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Illustrative baseline" value={`${metrics.manualMinutes} min`} detail="across disconnected tools" />
        <Metric
          label="Simulated run average"
          value={fmtMinutes(metrics.avgAutomatedMinutes)}
          detail={`${metrics.completedRuns} completed sample runs`}
        />
        <Metric
          label="Evidence records"
          value={String(await evidenceCount())}
          detail={`${metrics.approvalsPerformed} approvals recorded`}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Demo path</h2>
        <DemoStep
          number="01"
          title="See the reference baseline and simulator comparison"
          body={`Open the impact report to compare the documented ${metrics.manualSteps}-step, ${metrics.manualTools}-system, ${metrics.manualMinutes}-minute manual baseline with completed coordinated runs.`}
          href="/metrics"
          link="Open impact report"
        />
        <DemoStep
          number="02"
          title="Inspect a response that paused safely"
          body={
            recoveryCase
              ? `The seeded incident “${recoveryCase.incident.title}” has a failed mass-SMS step. Completed work is preserved; the procedure remains paused until a responder chooses a recovery action.`
              : "Create an incident and launch a response playbook, then use the Tools panel to simulate a tool outage."
          }
          href={recoveryCase ? `/incidents/${recoveryCase.incident.id}` : "/incidents/new"}
          link={recoveryCase ? "Open paused incident" : "Create demo incident"}
          badge={recoveryCase?.workflows.find((workflow) => workflow.status === "needs_recovery")?.status}
        />
        <DemoStep
          number="03"
          title="Restore, retry, then review before execution"
          body="Restore the Mass SMS tool in Tool status, retry only the failed step, and verify it returns to the approval queue. A human must explicitly approve before the simulated consequential action runs."
          href="/tools"
          link="Open tool status"
        />
        <DemoStep
          number="04"
          title="Verify evidence for every high-impact output"
          body="After approval, open the evidence ledger to inspect the recorded actor, approver, action parameters, incident context, and simulated tool receipt."
          href="/evidence"
          link="Open evidence ledger"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">Try the live workflow</h2>
        <p className="mt-1 text-sm text-slate-600">
          Seeded examples are available for fast evaluation. To launch a fresh simulation, create an
          incident, choose a playbook, and use the responder name field in the header so approval
          and evidence records are attributed.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {completedCase && (
            <Link href={`/incidents/${completedCase.incident.id}`} className="text-sm font-semibold text-blue-700 underline">
              View completed sample: {completedCase.incident.title}
            </Link>
          )}
          <Link href="/approvals" className="text-sm font-semibold text-blue-700 underline">
            Approval queue
          </Link>
          <Link href="/evidence" className="text-sm font-semibold text-blue-700 underline">
            Evidence ledger
          </Link>
        </div>
      </section>

      <p className="text-xs text-slate-400">
        This is a demonstration prototype. Tool integrations are simulated; do not use it for real
        emergency dispatch or public warning without authentication, operational integrations, and
        municipal approval.
      </p>
    </div>
  );
}

async function evidenceCount(): Promise<number> {
  const { db } = await import("@/db");
  const { evidence } = await import("@/db/schema");
  const { sql } = await import("drizzle-orm");
  const rows = await db.select({ count: sql<number>`count(*)` }).from(evidence);
  return Number(rows[0]?.count ?? 0);
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function DemoStep({
  number,
  title,
  body,
  href,
  link,
  badge,
}: {
  number: string;
  title: string;
  body: string;
  href: string;
  link: string;
  badge?: string;
}) {
  return (
    <article className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {badge && <StatusBadge status={badge} />}
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
        <Link href={href} className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline">
          {link} →
        </Link>
      </div>
    </article>
  );
}
