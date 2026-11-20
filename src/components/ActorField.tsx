"use client";

import { useEffect, useState } from "react";

/**
 * The acting responder's name. Persisted locally so it travels with queued
 * (offline) actions and is attributed in the audit trail / evidence.
 */
export function ActorField() {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(localStorage.getItem("sentinel_actor") || "");
  }, []);

  return (
    <label className="flex items-center gap-2 text-xs text-slate-200">
      <span className="hidden sm:inline">Responder</span>
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          localStorage.setItem("sentinel_actor", e.target.value);
        }}
        placeholder="Your name / badge"
        className="w-36 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-slate-100 placeholder:text-slate-500"
      />
    </label>
  );
}
