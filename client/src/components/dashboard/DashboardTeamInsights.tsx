"use client";

import { formatMoney } from "@/lib/format";
import { glassCard, sectionLabel } from "@/components/dashboard/dashboardStyles";

type Row = { id: string; name: string; total: number };

type Props = {
  topPaid: Row[];
};

export function DashboardTeamInsights({ topPaid }: Props) {
  return (
    <section aria-label="Team insights">
      <h2 className={`${sectionLabel} mb-3`}>Team</h2>
      <div className={`${glassCard} p-5 md:p-6`}>
        <p className="text-xs font-semibold text-purity-muted">Top payout totals (all time)</p>
        {!topPaid.length ? (
          <p className="mt-3 text-sm text-purity-muted">No dev payouts linked to people yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {topPaid.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <span className="min-w-0 truncate text-[15px] font-medium leading-snug text-purity-text">{r.name}</span>
                <span className="shrink-0 text-base font-semibold tabular-nums text-slate-800">
                  {formatMoney(r.total, "INR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
