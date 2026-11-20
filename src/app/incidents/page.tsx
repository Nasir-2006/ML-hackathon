
import Link from "next/link";
import { listIncidents } from "@/lib/queries";
import {
  INCIDENT_TYPE_LABEL,
  SEVERITY_LABEL,
  fmtMinutes,
  minutesBetween,
  timeAgo,
} from "@/lib/format";
import { StatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const rows = await listIncidents();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Emergency Reports
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            View reported emergencies and follow their progress.
          </p>
        </div>

        <Link
          href="/incidents/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Report an Emergency
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Emergency</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3">Response Progress</th>
                <th className="px-4 py-3">Last Updated</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <p className="font-semibold text-slate-700">
                      No emergencies reported yet.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Report an emergency to start managing its response.
                    </p>
                  </td>
                </tr>
              )}

              {rows.map(({ incident, workflows: wfs }) => {
                const wf = wfs[0];
                const dur = wf
                  ? minutesBetween(wf.startedAt, wf.finishedAt)
                  : null;

                return (
                  <tr key={incident.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="font-semibold text-slate-800 hover:text-blue-700 hover:underline"
                      >
                        {incident.title}
                      </Link>

                      <div className="text-xs text-slate-500">
                        {incident.reference} · {incident.location}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {INCIDENT_TYPE_LABEL[incident.type] ?? incident.type}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {SEVERITY_LABEL[incident.severity] ??
                        `Level ${incident.severity}`}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={incident.status} />
                    </td>

                    <td className="px-4 py-3">
                      {wf ? (
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={wf.status} />
                          {dur != null && (
                            <span className="text-[11px] text-slate-400">
                              {fmtMinutes(dur)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Not started
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-400">
                      {timeAgo(incident.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
