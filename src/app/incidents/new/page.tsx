import { PLAYBOOKS } from "@/lib/playbooks";

export const dynamic = "force-dynamic";

export default function NewIncidentPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Declare a new incident</h1>
        <p className="mt-1 text-sm text-slate-600">
          This works as a plain HTML form — it submits even on a slow link or with JavaScript disabled.
          Optionally launch a coordinated response playbook immediately.
        </p>
      </div>

      <form
        action="/api/incidents"
        method="post"
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <Field label="Incident title *">
          <input
            name="title"
            required
            placeholder="e.g. Flash flooding — Riverside underpass"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type *">
            <select name="type" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="flood">Flooding</option>
              <option value="fire">Fire</option>
              <option value="severe_weather">Severe Weather</option>
            </select>
          </Field>
          <Field label="Severity (1–5)">
            <select name="severity" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {[1, 2, 3, 4, 5].map((s) => (
                <option key={s} value={s} selected={s === 3}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Location *">
          <input
            name="location"
            required
            placeholder="e.g. Riverside District, 4th & Main"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Zone / sector">
            <input
              name="zone"
              placeholder="e.g. Zone A"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Population at risk">
            <input
              name="populationAtRisk"
              type="number"
              min={0}
              placeholder="e.g. 3200"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <Field label="Launch response playbook">
          <select name="playbook" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">— None (create incident only) —</option>
            {PLAYBOOKS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} ({p.steps.length} steps)
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Launching a playbook turns scattered manual work into one coordinated, recoverable procedure.
          </p>
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create incident
          </button>
          <a href="/incidents" className="text-sm font-semibold text-slate-600 hover:underline">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
