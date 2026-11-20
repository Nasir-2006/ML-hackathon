"use client";

import { useEffect, type ReactNode } from "react";
import { ConnectivityBar } from "./ConnectivityBar";

/**
 * Client frame: registers the offline app-shell service worker, applies the
 * low-bandwidth "lite" mode, and mounts the connectivity / sync bar.
 */
export function Shell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const applyLite = () => {
      const lite = localStorage.getItem("sentinel_lite") === "1";
      document.body.classList.toggle("lite", lite);
    };
    applyLite();
    window.addEventListener("sentinel:lite", applyLite);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is best-effort */
      });
    }

    return () => window.removeEventListener("sentinel:lite", applyLite);
  }, []);

  return (
    <>
      {children}
      <ConnectivityBar />
    </>
  );
}
