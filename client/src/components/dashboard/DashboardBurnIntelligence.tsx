"use client";

import type { BurnRunwaySnapshot } from "@/lib/burnRunway";
import { formatMoney } from "@/lib/format";
import { glassCard, sectionLabel } from "@/components/dashboard/dashboardStyles";

type Props = {
  burn: BurnRunwaySnapshot | null;
};

function pctLine(label: string, pct: number | null, invert: boolean) {
  if (pct == null || !Number.isFinite(pct)) {
    return <p className="mt-1.5 text-[10px] text-purity-muted">Insufficient history</p>;
  }
  const up = pct >= 0;
  const good = invert ? !up : up;
  const arrow = up ? "↑" : "↓";
  return (
    <p
      className={`mt-1.5 flex flex-wrap items-center gap-1 text-[10px] font-medium tabular-nums ${
        good ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      <span aria-hidden>{arrow}</span>
      <span>{Math.abs(pct).toFixed(1)}%</span>
      <span className="font-normal text-purity-muted">{label}</span>
    </p>
  );
}

export function DashboardBurnIntelligence({ burn }: Props) {
  if (!burn) return null;

  const runway =
    burn.runwayMonthsFromPending != null && Number.isFinite(burn.runwayMonthsFromPending)
      ? `${burn.runwayMonthsFromPending.toFixed(1)} mo`
      : "—";

  return (
    <section aria-label="Burn and runway intelligence" className="space-y-3">
      <div>
        <h2 className={sectionLabel}>Burn &amp; runway intelligence</h2>
        <p className="mt-0.5 text-[11px] leading-snug text-purity-muted">
          Heuristic: last-month payouts + 1/12 of subscriptions &amp; other expenses. Runway ≈ pending ÷ that burn proxy.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className={`${glassCard} p-4`}>
          <p className={sectionLabel}>Monthly burn</p>
          <p className="mt-2 text-lg font-bold tabular-nums tracking-tight text-slate-900">
            {formatMoney(burn.monthlyBurn, "INR")}
          </p>
          {pctLine("vs prior month", burn.monthlyBurnMomPct, true)}
          <p className="mt-1.5 text-[10px] leading-snug text-purity-muted">Payout month + opex slice</p>
        </article>

        <article className={`${glassCard} p-4`}>
          <p className={sectionLabel}>Operational burn</p>
          <p className="mt-2 text-lg font-bold tabular-nums tracking-tight text-slate-900">
            {formatMoney(burn.operationalBurn, "INR")}
          </p>
          {pctLine("vs prior month", burn.operationalMomPct, true)}
          <p className="mt-1.5 text-[10px] leading-snug text-purity-muted">Last month payout volume only</p>
        </article>

        <article className={`${glassCard} p-4`}>
          <p className={sectionLabel}>Runway (pending ÷ burn)</p>
          <p className="mt-2 text-lg font-bold tabular-nums tracking-tight text-slate-900">{runway}</p>
          <p className="mt-1.5 text-[10px] leading-snug text-purity-muted">
            How long pending revenue could cover the burn proxy
          </p>
        </article>

        <article className={`${glassCard} p-4`}>
          <p className={sectionLabel}>Expense velocity</p>
          <p className="mt-2 text-lg font-bold tabular-nums tracking-tight text-slate-900">
            {burn.expenseVelocityPct != null && Number.isFinite(burn.expenseVelocityPct)
              ? `${burn.expenseVelocityPct >= 0 ? "+" : ""}${burn.expenseVelocityPct.toFixed(1)}%`
              : "—"}
          </p>
          <p className="mt-1.5 text-[10px] leading-snug text-purity-muted">Composite burn vs prior month</p>
        </article>
      </div>
    </section>
  );
}
