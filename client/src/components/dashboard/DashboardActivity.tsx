"use client";

import type { ActivityItem } from "@/lib/dashboardIntelligence";
import { formatDate } from "@/lib/format";
import { glassCard, sectionLabel } from "@/components/dashboard/dashboardStyles";

type Props = {
  items: ActivityItem[];
};

const kindBadge: Record<ActivityItem["kind"], string> = {
  revenue: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  payout: "bg-orange-500/15 text-orange-200 ring-orange-500/30",
  project: "bg-sky-500/15 text-sky-200 ring-sky-500/30",
};

export function DashboardActivity({ items }: Props) {
  return (
    <section aria-label="Activity" className="mt-10">
      <div className="mb-3">
        <h2 className={sectionLabel}>Activity</h2>
        <p className="mt-1 text-sm text-purity-muted">Latest payments, payouts, and project events</p>
      </div>
      <div className={`${glassCard} max-h-[min(320px,50vh)] overflow-y-auto p-2 sm:p-3`}>
        {items.length === 0 ? (
          <p className="p-4 text-sm text-purity-muted">No recent activity.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5"
              >
                <span
                  className={`mt-0.5 inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-2 text-[10px] font-bold uppercase tracking-wide ring-1 ${kindBadge[item.kind]}`}
                >
                  {item.kind === "revenue" ? "Rev" : item.kind === "payout" ? "Pay" : "Prj"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-purity-text">{item.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0 text-xs text-purity-muted">
                    <span>{item.detail}</span>
                    <span aria-hidden>·</span>
                    <time dateTime={new Date(item.at).toISOString()}>{formatDate(new Date(item.at).toISOString())}</time>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
