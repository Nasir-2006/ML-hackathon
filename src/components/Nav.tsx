
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Guided Demo" },
  { href: "/incidents", label: "Emergencies" },
  { href: "/approvals", label: "Pending Decisions" },
  { href: "/tools", label: "Connected Services" },
  { href: "/metrics", label: "Results" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {LINKS.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
              active
                ? "bg-white text-slate-900"
                : "text-slate-200 hover:bg-slate-700"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
