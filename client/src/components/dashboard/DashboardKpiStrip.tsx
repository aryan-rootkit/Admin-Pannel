"use client";

import type { FinanceAnalytics } from "@/types/api";
import type { MomMeta } from "@/lib/dashboardIntelligence";
import { formatMoney } from "@/lib/format";
import { glassCard, sectionLabel, valueHero, cardPadding } from "@/components/dashboard/dashboardStyles";

function Trend({ meta, invert }: { meta: MomMeta; invert?: boolean }) {
  if (meta.pct == null || !Number.isFinite(meta.pct)) {
    return <p className="mt-2 text-[11px] text-purity-muted">No prior month to compare</p>;
  }
  const up = meta.pct >= 0;
  const good = invert ? !up : up;
  const arrow = up ? "↑" : "↓";
  return (
    <p
      className={`mt-2 flex items-center gap-1 text-[11px] font-medium tabular-nums ${
        good ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      <span aria-hidden>{arrow}</span>
      <span>{Math.abs(meta.pct).toFixed(1)}%</span>
      <span className="font-normal text-purity-muted">from last month</span>
    </p>
  );
}

type Props = {
  finance: FinanceAnalytics | null;
  momRevenue: MomMeta;
  momCost: MomMeta;
  momProfit: MomMeta;
};

export function DashboardKpiStrip({ finance, momRevenue, momCost, momProfit }: Props) {
  if (!finance) return null;

  return (
    <section aria-label="Key metrics">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-12 lg:gap-5">
        <article
          className={`${glassCard} relative col-span-2 overflow-hidden ${cardPadding} lg:col-span-4`}
        >
          <div className="pointer-events-none absolute inset-y-0 right-0 w-36 bg-gradient-to-l from-blue-500/[0.08] to-transparent" />
          <p className={sectionLabel}>Revenue</p>
          <div className={`${valueHero} mt-3`}>
            <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl">
              {formatMoney(finance.totalRevenue, "INR")}
            </p>
          </div>
          <Trend meta={momRevenue} />
          <p className="mt-1 text-[11px] leading-snug text-purity-muted">
            Cash received (all payment lines marked Received)
          </p>
        </article>

        <article className={`${glassCard} col-span-1 ${cardPadding} lg:col-span-2`}>
          <p className={sectionLabel}>Payouts</p>
          <div className={`${valueHero} mt-3`}>
            <p className="text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
              {formatMoney(finance.totalProjectCost, "INR")}
            </p>
          </div>
          <Trend meta={momCost} invert />
          <p className="mt-1 text-[11px] text-purity-muted">Project-related payouts</p>
        </article>

        <article className={`${glassCard} col-span-1 ${cardPadding} lg:col-span-2`}>
          <p className={sectionLabel}>Profit / loss</p>
          <div className={`${valueHero} mt-3`}>
            <p className="text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
              {formatMoney(finance.netProfit, "INR")}
            </p>
          </div>
          <Trend meta={momProfit} />
          <p className="mt-1 text-[11px] text-purity-muted">After subscriptions & company expenses</p>
        </article>

        <article className={`${glassCard} col-span-2 ${cardPadding} lg:col-span-2`}>
          <p className={sectionLabel}>Subscriptions &amp; other</p>
          <div className={`${valueHero} mt-3`}>
            <p className="text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
              {formatMoney(finance.totalExpenses, "INR")}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-purity-muted">
            Tools, subscriptions, non-project expenses
          </p>
        </article>

        <article className={`${glassCard} col-span-2 ${cardPadding} lg:col-span-2`}>
          <p className={sectionLabel}>Pending revenue</p>
          <div className={`${valueHero} mt-3`}>
            <p className="text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
              {formatMoney(finance.pendingRevenue, "INR")}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-purity-muted">Outstanding on active / pipeline contracts</p>
        </article>
      </div>
    </section>
  );
}
