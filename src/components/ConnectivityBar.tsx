"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearQueue, getQueue, setQueue, type QueuedAction } from "@/lib/offline";

export function ConnectivityBar() {
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [flash, setFlash] = useState("");
  const router = useRouter();

  useEffect(() => {
    setOnline(navigator.onLine);
    setQueued(getQueue().length);

    const goOnline = () => {
      setOnline(true);
      void flush();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function flush() {
    const q = getQueue();
    if (!q.length) return;
    setSyncing(true);
    const remaining: QueuedAction[] = [];
    for (const a of q) {
      try {
        const res = await fetch(a.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(a.body),
        });
        if (!res.ok) remaining.push(a);
      } catch {
        remaining.push(a);
      }
    }
    if (remaining.length) setQueue(remaining);
    else clearQueue();
    setQueued(remaining.length);
    setSyncing(false);
    setFlash(
      remaining.length
        ? `Reconnected — ${q.length - remaining.length} action(s) synced, ${remaining.length} still pending.`
        : `Reconnected — ${q.length} queued action(s) synced.`,
    );
    setTimeout(() => setFlash(""), 6000);
    router.refresh();
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-700 bg-slate-900 text-xs text-slate-100"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
            online ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${online ? "bg-white" : "bg-white animate-pulse"}`} />
          {online ? "Online" : "Offline"}
        </span>
        {queued > 0 && (
          <span className="rounded-full bg-amber-500 px-2.5 py-1 font-semibold text-amber-950">
            {syncing ? "Syncing…" : `${queued} action(s) queued`}
          </span>
        )}
        <span className="ml-auto truncate text-slate-300">
          {flash || "Field mode: actions taken offline are saved and replayed automatically."}
        </span>
      </div>
    </div>
  );
}
