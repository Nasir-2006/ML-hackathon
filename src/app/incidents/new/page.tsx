
import { PLAYBOOKS } from "@/lib/playbooks";

export const dynamic = "force-dynamic";

export default function NewIncidentPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Report an Emergency
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Enter the emergency details below so the response team
          can understand the situation and take appropriate action.
        </p>
      </div>

      <form
        action="/api/incidents"
        method="post"
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <Field label="Emergency Title *">
          <input
            name="title"
            required
            placeholder="e.g. Flooding near Riverside Bridge"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Emergency Type *">
            <select
              name="type"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="flood">Flooding</option>
              <option value="fire">Fire</option>
              <option value="severe_weather">Severe Weather</option>
            </select>
          </Field>

          <Field label="Priority Level (1–5)">
            <select
              name="severity"
              defaultValue="3"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="1">1 - Low</option>
              <option value="2">2 - Guarded</option>
              <option value="3">3 - Elevated</option>
              <option value="4">4 - High</option>
              <option value="5">5 - Critical</option>
            </select>
          </Field>
        </div>

        <Field label="Emergency Location *">
          <input
            name="location"
            required
            placeholder="Enter the affected area or address"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Area or Zone">
            <input
              name="zone"
              placeholder="e.g. Zone A"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Estimated People Affected">
            <input
              name="populationAtRisk"
              type="number"
              min={0}
              placeholder="e.g. 3200"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h2 className="text-base font-semibold text-slate-800">
            Response Plan
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Choose a plan to organize the response. You can also
            report the emergency first and start a plan later.
          </p>
        </div>

        <Field label="Choose a Response Plan">
          <select
            name="playbook"
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">No plan for now</option>

            {PLAYBOOKS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} ({p.steps.length} actions)
              </option>
            ))}
          </select>

          <p className="mt-1 text-xs text-slate-500">
            A response plan helps organize tasks such as contacting
            emergency teams, opening shelters and informing residents.
            Some important actions require approval before they happen.
          </p>
        </Field>

        <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Submit Emergency Report
          </button>

          <a
            href="/incidents"
            className="text-sm font-semibold text-slate-600 hover:underline"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
