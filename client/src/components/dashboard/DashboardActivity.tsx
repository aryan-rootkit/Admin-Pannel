"use client";

import type { ActivityItem } from "@/lib/dashboardIntelligence";
import { formatDate } from "@/lib/format";
import { glassCard, sectionLabel, cardPadding } from "@/components/dashboard/dashboardStyles";

const kindBadge: Record<ActivityItem["kind"], string> = {
  revenue: "bg-emerald-100 text-emerald-800 ring-emerald-200/80",
  payout: "bg-orange-100 text-orange-900 ring-orange-200/80",
  project: "bg-sky-100 text-sky-900 ring-sky-200/80",
};

type Props = {
  items: ActivityItem[];
  /** Tighter layout for right-rail placement */
  compact?: boolean;
  /**
   * When false, the list grows with the page (no inner scroll / max-height).
   * Use on the dashboard rail so one page scroll covers summary + activity + team.
   */
  containScroll?: boolean;
};

export function DashboardActivity({ items, compact, containScroll = true }: Props) {
  const scrollClasses =
    containScroll &&
    `${compact ? "max-h-[min(280px,42vh)]" : "max-h-[min(320px,50vh)]"} overflow-y-auto overscroll-y-contain`;

  return (
    <section aria-label="Activity">
      <div className={compact ? "mb-2" : "mb-4"}>
        <h2 className={sectionLabel}>Activity</h2>
        {!compact ? (
          <p className="mt-1 text-sm text-purity-muted">Latest payments, payouts, and project events</p>
        ) : null}
      </div>
      <div className={`${glassCard} p-2 sm:p-3${scrollClasses ? ` ${scrollClasses}` : ""}`}>
        {items.length === 0 ? (
          <p className={`${cardPadding} text-sm text-purity-muted`}>No recent activity.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50"
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
