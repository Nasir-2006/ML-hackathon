import { impactTone, statusTone } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusTone(
        status,
      )}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function ImpactBadge({ impact }: { impact: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${impactTone(
        impact,
      )}`}
    >
      {impact}
    </span>
  );
}
