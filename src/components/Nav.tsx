"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/demo", label: "Demo" },
  { href: "/incidents", label: "Incidents" },
  { href: "/approvals", label: "Approvals" },
  { href: "/tools", label: "Tools" },
  { href: "/metrics", label: "Impact" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap items-center gap-1">
      {LINKS.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
              active ? "bg-white text-slate-900" : "text-slate-200 hover:bg-slate-700"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
