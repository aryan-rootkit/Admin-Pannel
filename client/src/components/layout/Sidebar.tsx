"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const mainNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/projects", label: "Projects" },
  { href: "/peoples", label: "Peoples" },
  { href: "/revenues", label: "Revenues" },
  { href: "/payouts", label: "Payouts" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--purity-border)] bg-[var(--purity-card)] md:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ background: "var(--purity-accent)" }}
        >
          R
        </div>
        <div className="text-xs font-bold uppercase tracking-wide text-[var(--purity-text)]">
          Rootkit UI
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 pb-6">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
          Main
        </p>
        {mainNav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--purity-sidebar-active)] text-[var(--purity-accent-hover)]"
                  : "text-[var(--purity-muted)] hover:bg-[var(--purity-page)] hover:text-[var(--purity-text)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
