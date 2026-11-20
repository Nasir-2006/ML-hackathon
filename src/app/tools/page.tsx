import { getToolStatuses } from "@/lib/queries";
import { ImpactBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const tools = await getToolStatuses();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tool status & disruption simulator</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Each response step calls a municipal system. Mark a tool <strong>unavailable</strong> to
          simulate a partial outage, then start or run a procedure and watch it pause for recovery.
          Restore the tool and <strong>Retry</strong> the failed step — all completed work is
          preserved. These are plain form posts, so they work on a slow link too.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {tools.map((t) => (
          <div
            key={t.key}
            className={`rounded-xl border bg-white p-4 ${
              t.available ? "border-slate-200" : "border-orange-300 bg-orange-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">{t.label}</span>
              <ImpactBadge impact={t.impact} />
              {t.consequential && (
                <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-800">
                  approval
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">{t.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                  t.available ? "text-emerald-700" : "text-orange-700"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    t.available ? "bg-emerald-500" : "bg-orange-500 animate-pulse"
                  }`}
                />
                {t.available ? "Available" : "Unavailable"}
              </span>

              <form action="/api/tools" method="post" className="flex gap-2">
                <input type="hidden" name="tool" value={t.key} />
                {t.available ? (
                  <>
                    <input type="hidden" name="available" value="false" />
                    <input type="hidden" name="note" value="Simulated outage for recovery drill" />
                    <button
                      type="submit"
                      className="rounded-md border border-orange-300 bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800 hover:bg-orange-200"
                    >
                      Simulate outage
                    </button>
                  </>
                ) : (
                  <>
                    <input type="hidden" name="available" value="true" />
                    <input type="hidden" name="note" value="Restored by operator" />
                    <button
                      type="submit"
                      className="rounded-md border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-200"
                    >
                      Restore
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
