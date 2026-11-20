import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvidenceDetail } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import { ImpactBadge, StatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function EvidenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const evidenceId = parseInt(id, 10);
  if (!evidenceId) notFound();

  const data = await getEvidenceDetail(evidenceId);
  if (!data) notFound();
  const { evidence: ev, incident, step } = data;
  const payload = (ev.payload ?? {}) as Record<string, unknown>;
  const output = (payload.output ?? {}) as Record<string, unknown>;
  const params_ = (payload.params ?? {}) as Record<string, unknown>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/evidence" className="text-sm font-semibold text-blue-700 hover:underline">
        ← Evidence ledger
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900">{ev.action}</h1>
          <ImpactBadge impact={ev.impact} />
          <span className="ml-auto font-mono text-xs text-slate-500">{ev.reference}</span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Tool: <span className="font-semibold">{ev.tool}</span>
        </p>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field k="Incident">
            {incident ? (
              <Link href={`/incidents/${incident.id}`} className="text-blue-700 hover:underline">
                {incident.title} ({incident.reference})
              </Link>
            ) : (
              "—"
            )}
          </Field>
          <Field k="Step">
            {step ? (
              <Link href={`/incidents/${incident?.id}`} className="hover:underline">
                #{step.position} {step.name}
              </Link>
            ) : (
              "—"
            )}
          </Field>
          <Field k="Executed by">{ev.actor ?? "—"}</Field>
          <Field k="Approved by">{ev.approver ?? "— (auto / not required)"}</Field>
          <Field k="Recorded">{timeAgo(ev.createdAt)}</Field>
          <Field k="Impact">{ev.impact}</Field>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Tool receipt & output
        </h2>
        <pre className="mt-2 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-emerald-200">
          {JSON.stringify(output, null, 2)}
        </pre>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Action parameters
          </h2>
          <pre className="mt-2 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
            {JSON.stringify(params_, null, 2)}
          </pre>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Incident context
          </h2>
          <pre className="mt-2 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
            {JSON.stringify(payload.incident ?? {}, null, 2)}
          </pre>
        </div>
      </section>

      <p className="text-xs text-slate-400">
        This record is written at execution time for every consequential (high-impact) action and is
        the basis for post-incident human review and audit.
      </p>
    </div>
  );
}

function Field({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{k}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-800">{children}</dd>
    </div>
  );
}
