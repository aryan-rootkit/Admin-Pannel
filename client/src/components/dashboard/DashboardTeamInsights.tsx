"use client";

import { formatMoney } from "@/lib/format";
import { glassCard, sectionLabel, cardPadding } from "@/components/dashboard/dashboardStyles";

type Row = { id: string; name: string; total: number };

type Props = {
  peopleCount: number;
  activeWithProjects: number;
  topPaid: Row[];
};

export function DashboardTeamInsights({ peopleCount, activeWithProjects, topPaid }: Props) {
  return (
    <section aria-label="Team insights">
      <h2 className={`${sectionLabel} mb-4`}>Team</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`${glassCard} ${cardPadding}`}>
          <p className="text-xs font-medium text-purity-muted">People in directory</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-purity-text">{peopleCount}</p>
          <p className="mt-1 text-[11px] text-purity-muted">
            {activeWithProjects} with assigned projects
          </p>
        </div>
        <div className={`${glassCard} ${cardPadding}`}>
          <p className="text-xs font-medium text-purity-muted">Top payout totals (all time)</p>
          {!topPaid.length ? (
            <p className="mt-2 text-sm text-purity-muted">No dev payouts linked to people yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {topPaid.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-purity-text">{r.name}</span>
                  <span className="shrink-0 tabular-nums text-purity-muted">
                    {formatMoney(r.total, "INR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
