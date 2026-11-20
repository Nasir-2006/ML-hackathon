"use client";

import { useEffect, useState } from "react";

/** Toggles low-bandwidth "lite" mode (hides non-essential UI). */
export function LiteToggle() {
  const [lite, setLite] = useState(false);

  useEffect(() => {
    setLite(localStorage.getItem("sentinel_lite") === "1");
  }, []);

  function toggle() {
    const next = !lite;
    setLite(next);
    localStorage.setItem("sentinel_lite", next ? "1" : "0");
    window.dispatchEvent(new Event("sentinel:lite"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={lite}
      title="Low-bandwidth mode: hide non-essential panels"
      className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${
        lite
          ? "border-emerald-300 bg-emerald-500 text-white"
          : "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
      }`}
    >
      {lite ? "Lite: ON" : "Lite: OFF"}
    </button>
  );
}
