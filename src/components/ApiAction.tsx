"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addQueue, getActor, type QueuedAction } from "@/lib/offline";

type Variant = "primary" | "danger" | "ghost" | "warn";

const VARIANT: Record<Variant, string> = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-700",
  danger: "bg-red-600 hover:bg-red-700 text-white border-red-700",
  warn: "bg-orange-500 hover:bg-orange-600 text-white border-orange-600",
  ghost: "bg-white hover:bg-slate-100 text-slate-700 border-slate-300",
};

export function ApiAction({
  url,
  body = {},
  gather,
  label,
  variant = "primary",
  confirm,
  title,
  className = "",
}: {
  url: string;
  body?: Record<string, string>;
  /** Map of body key -> element id whose value should be read at click time. */
  gather?: Record<string, string>;
  label: string;
  variant?: Variant;
  confirm?: string;
  title?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  async function run(e: React.MouseEvent) {
    e.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);

    const payload: Record<string, string> = { ...body, actor: getActor() };
    if (gather) {
      for (const [key, elId] of Object.entries(gather)) {
        const el = document.getElementById(elId) as HTMLInputElement | HTMLTextAreaElement | null;
        if (el) payload[key] = el.value;
      }
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const n = addQueue({ url, body: payload, label, queuedAt: Date.now() });
      setFlash(`Offline — queued (${n} pending). Will sync automatically.`);
      setBusy(false);
      return;
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setFlash(j.error || "Action failed.");
      } else {
        setFlash("");
        router.refresh();
      }
    } catch {
      const n = addQueue({ url, body: payload, label, queuedAt: Date.now() });
      setFlash(`Offline — queued (${n} pending). Will sync automatically.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={`inline-flex flex-col gap-1 ${className}`}>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        title={title}
        className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 ${VARIANT[variant]}`}
      >
        {busy ? "Working…" : label}
      </button>
      {flash && <span className="text-[11px] leading-tight text-amber-700">{flash}</span>}
    </span>
  );
}
