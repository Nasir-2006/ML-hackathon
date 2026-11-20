import Link from "next/link";
import { listEvidence } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import { ImpactBadge, StatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const rows = await listEvidence();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Evidence ledger</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every high-impact output (consequential tool action) writes a tamper-evident record here:
          what was done, by whom, with whose approval, and the tool&apos;s receipt. This is the
          after-the-fact human-review path.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Reference</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Impact</th>
              <th className="px-4 py-2">Incident</th>
              <th className="px-4 py-2">Actor / Approver</th>
              <th className="px-4 py-2">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No high-impact outputs recorded yet.
                </td>
              </tr>
            )}
            {rows.map(({ evidence: ev, incident }) => (
              <tr key={ev.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{ev.reference}</td>
                <td className="px-4 py-3">
                  <Link href={`/evidence/${ev.id}`} className="font-semibold text-slate-800 hover:underline">
                    {ev.action}
                  </Link>
                  <div className="text-xs text-slate-500">{ev.tool}</div>
                </td>
                <td className="px-4 py-3">
                  <ImpactBadge impact={ev.impact} />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {incident ? (
                    <Link href={`/incidents/${incident.id}`} className="hover:underline">
                      {incident.title}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {ev.actor ?? "—"}
                  {ev.approver ? ` / ${ev.approver}` : ""}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{timeAgo(ev.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
