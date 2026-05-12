"use client";

import Link from "next/link";
import { glassCard, sectionLabel, cardPadding } from "@/components/dashboard/dashboardStyles";

const actions = [
  { href: "/projects/create", label: "Add project", desc: "New engagement" },
  { href: "/revenues", label: "Record revenue", desc: "Cash & installments" },
  { href: "/payouts", label: "Add payout", desc: "Pay team & vendors" },
  { href: "/clients/create", label: "Add client", desc: "Expand pipeline" },
] as const;

export function DashboardQuickActions() {
  return (
    <section aria-label="Quick actions" className="pb-2">
      <h2 className={`${sectionLabel} mb-4`}>Quick actions</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`${glassCard} group block ${cardPadding} transition hover:border-purity-accent/35 hover:shadow-[var(--rk-shadow-card)]`}
          >
            <p className="text-sm font-semibold text-purity-text group-hover:text-purity-accent">
              {a.label}
            </p>
            <p className="mt-1 text-[11px] text-purity-muted">{a.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
