"use client";

import Link from "next/link";

const actions = [
  { href: "/projects/create", label: "Add project" },
  { href: "/revenues", label: "Add revenue" },
  { href: "/clients/create", label: "Add client" },
  { href: "/payouts", label: "Add payout" },
] as const;

const chipClass =
  "inline-flex items-center justify-center rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-[11px] font-semibold tracking-tight text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-slate-50 hover:text-slate-900 sm:px-3 sm:text-xs";

/**
 * Compact secondary actions for the dashboard header (does not dominate layout).
 */
export function DashboardQuickActionChips() {
  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Quick actions">
      {actions.map((a) => (
        <Link key={a.href} href={a.href} className={chipClass}>
          {a.label}
        </Link>
      ))}
    </nav>
  );
}
