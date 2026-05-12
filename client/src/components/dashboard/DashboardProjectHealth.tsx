"use client";

import Link from "next/link";
import type { FinanceAnalytics } from "@/types/api";
import { formatMoney } from "@/lib/format";
import { glassCard, sectionLabel } from "@/components/dashboard/dashboardStyles";

type Props = {
  finance: FinanceAnalytics | null;
};

export function DashboardProjectHealth({ finance }: Props) {
  const breakdown = finance?.projectBreakdown ?? [];
  const top = [...breakdown]
    .filter((r) => r.pending > 0 || r.totalReceived > 0)
    .sort((a, b) => (b.pending || 0) - (a.pending || 0))
    .slice(0, 4);

  return (
    <section aria-label="Project health">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className={sectionLabel}>Project health</h2>
          <p className="mt-0.5 text-[11px] text-purity-muted">Where cash and delivery pressure concentrate</p>
        </div>
        <Link
          href="/projects"
          className="text-[11px] font-semibold text-purity-accent hover:underline"
        >
          View all projects
        </Link>
      </div>
      <div className={`${glassCard} divide-y divide-slate-100`}>
        {!top.length ? (
          <p className="p-4 text-xs text-purity-muted">No project finance data yet.</p>
        ) : (
          top.map((row) => (
            <div
              key={row.projectId}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-purity-text">{row.projectName || "—"}</p>
                <p className="mt-0.5 text-[11px] text-purity-muted">
                  Pending {formatMoney(row.pending, "INR")} · Received {formatMoney(row.totalReceived, "INR")}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-semibold tabular-nums ${row.projectProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatMoney(row.projectProfit, "INR")}
                </p>
                <p className="text-[9px] uppercase tracking-wide text-purity-muted">Project profit</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
