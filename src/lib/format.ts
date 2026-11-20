export function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function minutesBetween(a: Date | null, b: Date | null): number | null {
  if (!a || !b) return null;
  return (b.getTime() - a.getTime()) / 60000;
}

export function fmtMinutes(m: number | null | undefined): string {
  if (m == null) return "—";
  if (m < 1) return `${Math.round(m * 60)}s`;
  return `${m.toFixed(1)} min`;
}

export function fmtNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export const SEVERITY_LABEL: Record<number, string> = {
  1: "Low",
  2: "Guarded",
  3: "Elevated",
  4: "High",
  5: "Catastrophic",
};

export const INCIDENT_TYPE_LABEL: Record<string, string> = {
  flood: "Flooding",
  fire: "Fire",
  severe_weather: "Severe Weather",
};

export function statusTone(status: string): string {
  switch (status) {
    case "active":
      return "bg-red-100 text-red-800 border-red-200";
    case "contained":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "resolved":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "running":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "awaiting_approval":
      return "bg-violet-100 text-violet-800 border-violet-200";
    case "needs_recovery":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "completed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "aborted":
      return "bg-slate-200 text-slate-700 border-slate-300";
    case "succeeded":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "failed":
      return "bg-red-100 text-red-800 border-red-200";
    case "waiting":
      return "bg-violet-100 text-violet-800 border-violet-200";
    case "skipped":
      return "bg-slate-200 text-slate-700 border-slate-300";
    case "pending":
      return "bg-slate-100 text-slate-600 border-slate-200";
    case "executing":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function impactTone(impact: string): string {
  switch (impact) {
    case "critical":
      return "bg-red-600 text-white";
    case "high":
      return "bg-orange-500 text-white";
    case "medium":
      return "bg-amber-400 text-black";
    default:
      return "bg-slate-300 text-slate-800";
  }
}
