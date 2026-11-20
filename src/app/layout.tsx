import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { Nav } from "@/components/Nav";
import { LiteToggle } from "@/components/LiteToggle";
import { ActorField } from "@/components/ActorField";

export const metadata: Metadata = {
  title: "Sentinel — Municipal Emergency Coordination",
  description:
    "Dependable, low-bandwidth incident response workflows with approval gates, failure recovery, and evidence for every high-impact action.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <Shell>
          <header className="bg-slate-900 text-white">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
              <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
                <span className="grid h-7 w-7 place-items-center rounded bg-blue-600 text-sm">S</span>
                <span>Sentinel</span>
              </Link>
              <span className="hidden text-xs text-slate-400 md:inline">
                Municipal Emergency Coordination
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-3">
                <Nav />
                <LiteToggle />
                <ActorField />
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6 pb-24">{children}</main>
        </Shell>
      </body>
    </html>
  );
}
