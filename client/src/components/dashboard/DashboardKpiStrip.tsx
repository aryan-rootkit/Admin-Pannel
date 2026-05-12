"use client";

import type { FinanceAnalytics } from "@/types/api";
import type { MomMeta } from "@/lib/dashboardIntelligence";
import type { BurnRunwaySnapshot } from "@/lib/burnRunway";
import { formatMoney } from "@/lib/format";
import { kpiCard, sectionLabel, valueHero } from "@/components/dashboard/dashboardStyles";

function Trend({ meta, invert, suffix = "from last month" }: { meta: MomMeta; invert?: boolean; suffix?: string }) {
  if (meta.pct == null || !Number.isFinite(meta.pct)) {
    return <p className="mt-1.5 text-[10px] leading-snug text-purity-muted">No prior month to compare</p>;
  }
  const up = meta.pct >= 0;
  const good = invert ? !up : up;
  const arrow = up ? "↑" : "↓";
  return (
    <p
      className={`mt-1.5 flex flex-wrap items-baseline gap-x-1 text-[10px] font-semibold tabular-nums leading-tight ${
        good ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      <span aria-hidden>{arrow}</span>
      <span>{Math.abs(meta.pct).toFixed(1)}%</span>
      <span className="font-normal text-purity-muted">{suffix}</span>
    </p>
  );
}

function BurnTrend({ pct }: { pct: number | null }) {
  if (pct == null || !Number.isFinite(pct)) {
    return <p className="mt-1.5 text-[10px] leading-snug text-purity-muted">No prior month to compare</p>;
  }
  const up = pct >= 0;
  const good = !up;
  const arrow = up ? "↑" : "↓";
  return (
    <p
      className={`mt-1.5 flex flex-wrap items-baseline gap-x-1 text-[10px] font-semibold tabular-nums leading-tight ${
        good ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      <span aria-hidden>{arrow}</span>
      <span>{Math.abs(pct).toFixed(1)}%</span>
      <span className="font-normal text-purity-muted">burn vs prior</span>
    </p>
  );
}

type Props = {
  finance: FinanceAnalytics | null;
  momRevenue: MomMeta;
  momCost: MomMeta;
  momProfit: MomMeta;
  burn: BurnRunwaySnapshot | null;
};

export function DashboardKpiStrip({ finance, momRevenue, momCost, momProfit, burn }: Props) {
  if (!finance) return null;

  const runwayLabel =
    burn?.runwayMonthsFromPending != null && Number.isFinite(burn.runwayMonthsFromPending)
      ? `${burn.runwayMonthsFromPending.toFixed(1)} mo`
      : "—";

  return (
    <section aria-label="Key metrics">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
        <article className={`${kpiCard} relative overflow-hidden`}>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-blue-500/[0.07] to-transparent sm:w-20" />
          <p className={sectionLabel}>Revenue</p>
          <div className={`${valueHero} mt-2.5`}>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl xl:text-[1.35rem] xl:leading-tight">
              {formatMoney(finance.totalRevenue, "INR")}
            </p>
          </div>
          <Trend meta={momRevenue} />
          <p className="mt-auto pt-2 text-[10px] leading-snug text-purity-muted">
            Cash received (all payment lines marked Received)
          </p>
        </article>

        <article className={kpiCard}>
          <p className={sectionLabel}>Payouts</p>
          <div className={`${valueHero} mt-2.5`}>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl xl:text-[1.35rem] xl:leading-tight">
              {formatMoney(finance.totalProjectCost, "INR")}
            </p>
          </div>
          <Trend meta={momCost} invert />
          <p className="mt-auto pt-2 text-[10px] leading-snug text-purity-muted">Project-related payouts</p>
        </article>

        <article className={kpiCard}>
          <p className={sectionLabel}>Profit / loss</p>
          <div className={`${valueHero} mt-2.5`}>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl xl:text-[1.35rem] xl:leading-tight">
              {formatMoney(finance.netProfit, "INR")}
            </p>
          </div>
          <Trend meta={momProfit} />
          <p className="mt-auto pt-2 text-[10px] leading-snug text-purity-muted">After subscriptions & company expenses</p>
        </article>

        <article className={kpiCard}>
          <p className={sectionLabel}>Subscriptions &amp; other</p>
          <div className={`${valueHero} mt-2.5`}>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl xl:text-[1.35rem] xl:leading-tight">
              {formatMoney(finance.totalExpenses, "INR")}
            </p>
          </div>
          <p className="mt-auto pt-2 text-[10px] leading-snug text-purity-muted">Tools, subscriptions, non-project expenses</p>
        </article>

        <article className={kpiCard}>
          <p className={sectionLabel}>Pending revenue</p>
          <div className={`${valueHero} mt-2.5`}>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl xl:text-[1.35rem] xl:leading-tight">
              {formatMoney(finance.pendingRevenue, "INR")}
            </p>
          </div>
          <p className="mt-auto pt-2 text-[10px] leading-snug text-purity-muted">Outstanding on active / pipeline contracts</p>
        </article>

        <article className={`${kpiCard} ring-slate-300/50`}>
          <p className={sectionLabel}>Burn &amp; runway</p>
          <div className={`${valueHero} mt-2.5 bg-gradient-to-b from-slate-50/90 to-slate-100/80`}>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl xl:text-[1.35rem] xl:leading-tight">
              {runwayLabel}
            </p>
            {burn ? (
              <p className="mt-1 text-[10px] font-medium tabular-nums text-slate-600">{formatMoney(burn.monthlyBurn, "INR")} / mo burn</p>
            ) : null}
          </div>
          {burn ? <BurnTrend pct={burn.monthlyBurnMomPct} /> : <p className="mt-1.5 text-[10px] text-purity-muted">—</p>}
          <p className="mt-auto pt-2 text-[10px] leading-snug text-purity-muted">Pending revenue ÷ monthly burn proxy</p>
        </article>
      </div>
    </section>
  );
}
