"use client";

import type { FinanceAnalytics } from "@/types/api";
import type { MomMeta } from "@/lib/dashboardIntelligence";
import { formatMoney } from "@/lib/format";
import { glassCard, sectionLabel, valueHero, cardPadding } from "@/components/dashboard/dashboardStyles";

const kpiSurface =
  `${glassCard} ring-1 ring-slate-200/55 transition-shadow duration-200 hover:shadow-[0_16px_40px_-24px_rgba(15,23,42,0.18)]`;

function Trend({ meta, invert }: { meta: MomMeta; invert?: boolean }) {
  if (meta.pct == null || !Number.isFinite(meta.pct)) {
    return (
      <p className="mt-2 inline-flex w-fit rounded-md bg-slate-100/90 px-2 py-1 text-[10px] font-medium text-purity-muted">
        No prior month to compare
      </p>
    );
  }
  const up = meta.pct >= 0;
  const good = invert ? !up : up;
  const arrow = up ? "↑" : "↓";
  return (
    <p className="mt-2">
      <span
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold tabular-nums ring-1 ${
          good
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200/70"
            : "bg-rose-50 text-rose-700 ring-rose-200/70"
        }`}
      >
        <span aria-hidden>{arrow}</span>
        <span>{Math.abs(meta.pct).toFixed(1)}%</span>
        <span className="font-normal text-slate-600/90">vs last month</span>
      </span>
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-12 lg:gap-5">
        <article className={`${kpiSurface} relative col-span-2 overflow-hidden ${cardPadding} lg:col-span-4`}>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-blue-500/[0.09] to-transparent" />
          <p className={`${sectionLabel} relative text-slate-500`}>Revenue</p>
          <div className={`${valueHero} relative mt-2.5 sm:mt-3`}>
            <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-[1.65rem] md:text-3xl">
              {formatMoney(finance.totalRevenue, "INR")}
            </p>
          </div>
          <Trend meta={momRevenue} />
          <p className="mt-2 text-[11px] leading-relaxed text-purity-muted">
            Cash received (all payment lines marked Received)
          </p>
        </article>

        <article className={`${kpiSurface} col-span-1 ${cardPadding} lg:col-span-2`}>
          <p className={`${sectionLabel} text-slate-500`}>Payouts</p>
          <div className={`${valueHero} mt-2.5 sm:mt-3`}>
            <p className="text-lg font-bold tabular-nums text-slate-900 sm:text-xl md:text-2xl">
              {formatMoney(finance.totalProjectCost, "INR")}
            </p>
          </div>
          <Trend meta={momCost} invert />
          <p className="mt-2 text-[11px] leading-relaxed text-purity-muted">Project-related payouts</p>
        </article>

        <article className={`${kpiSurface} col-span-1 ${cardPadding} lg:col-span-2`}>
          <p className={`${sectionLabel} text-slate-500`}>Profit / loss</p>
          <div className={`${valueHero} mt-2.5 sm:mt-3`}>
            <p className="text-lg font-bold tabular-nums text-slate-900 sm:text-xl md:text-2xl">
              {formatMoney(finance.netProfit, "INR")}
            </p>
          </div>
          <Trend meta={momProfit} />
          <p className="mt-2 text-[11px] leading-relaxed text-purity-muted">After subscriptions & company expenses</p>
        </article>

        <article className={`${kpiSurface} col-span-2 ${cardPadding} lg:col-span-2`}>
          <p className={`${sectionLabel} text-slate-500`}>Subscriptions &amp; other</p>
          <div className={`${valueHero} mt-2.5 sm:mt-3`}>
            <p className="text-lg font-bold tabular-nums text-slate-900 sm:text-xl md:text-2xl">
              {formatMoney(finance.totalExpenses, "INR")}
            </p>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-purity-muted">Tools, subscriptions, non-project expenses</p>
        </article>

        <article className={`${kpiSurface} col-span-2 ${cardPadding} lg:col-span-2`}>
          <p className={`${sectionLabel} text-slate-500`}>Pending revenue</p>
          <div className={`${valueHero} mt-2.5 sm:mt-3`}>
            <p className="text-lg font-bold tabular-nums text-slate-900 sm:text-xl md:text-2xl">
              {formatMoney(finance.pendingRevenue, "INR")}
            </p>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-purity-muted">Outstanding on active / pipeline contracts</p>
        </article>
      </div>
    </section>
  );
}
