"use client";

import { formatMoney } from "@/lib/format";
import { kpiCard, sectionLabel, valueHero } from "@/components/dashboard/dashboardStyles";
import type { PfMomMeta } from "@/types/personalFinance";

function Trend({
  meta,
  invert,
  suffix = "from last month",
}: {
  meta: PfMomMeta;
  invert?: boolean;
  suffix?: string;
}) {
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

type Props = {
  kpis: {
    totalBalance: number;
    cashNet: number;
    netWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    debtLoans: number;
    moneyToReceive: number;
    monthlyBurn: number;
    momIncome: PfMomMeta;
    momExpense: PfMomMeta;
    momBurn: PfMomMeta;
  } | null;
};

export function PfKpiSection({ kpis }: Props) {
  if (!kpis) return null;
  return (
    <section aria-label="Personal finance KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-7">
      <article className={`${kpiCard} relative overflow-hidden`}>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-emerald-500/[0.07] to-transparent sm:w-20" />
        <p className={sectionLabel}>Total balance</p>
        <div className={`${valueHero} mt-2.5`}>
          <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl xl:text-[1.2rem] xl:leading-tight">
            {formatMoney(kpis.cashNet, "INR")}
          </p>
        </div>
        <p className="mt-auto pt-2 text-[10px] leading-snug text-purity-muted">Cash ledger net (all in − all out)</p>
      </article>

      <article className={kpiCard}>
        <p className={sectionLabel}>Net position</p>
        <div className={`${valueHero} mt-2.5`}>
          <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl xl:text-[1.2rem] xl:leading-tight">
            {formatMoney(kpis.netWorth, "INR")}
          </p>
        </div>
        <p className="mt-auto pt-2 text-[10px] leading-snug text-purity-muted">Cash + receivables − debts</p>
      </article>

      <article className={kpiCard}>
        <p className={sectionLabel}>Monthly income</p>
        <div className={`${valueHero} mt-2.5`}>
          <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl xl:text-[1.2rem] xl:leading-tight">
            {formatMoney(kpis.monthlyIncome, "INR")}
          </p>
        </div>
        <Trend meta={kpis.momIncome} />
        <p className="mt-auto pt-2 text-[10px] leading-snug text-purity-muted">
          Ledger inflows · use My money card for Rootkit profit
        </p>
      </article>

      <article className={kpiCard}>
        <p className={sectionLabel}>Monthly expenses</p>
        <div className={`${valueHero} mt-2.5`}>
          <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl xl:text-[1.2rem] xl:leading-tight">
            {formatMoney(kpis.monthlyExpenses, "INR")}
          </p>
        </div>
        <Trend meta={kpis.momExpense} invert />
        <p className="mt-auto pt-2 text-[10px] leading-snug text-purity-muted">Outflows excl. transfers · this month</p>
      </article>

      <article className={kpiCard}>
        <p className={sectionLabel}>Debt / loans</p>
        <div className={`${valueHero} mt-2.5`}>
          <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl xl:text-[1.2rem] xl:leading-tight">
            {formatMoney(kpis.debtLoans, "INR")}
          </p>
        </div>
        <p className="mt-auto pt-2 text-[10px] leading-snug text-purity-muted">Outstanding borrowed (bank + people)</p>
      </article>

      <article className={kpiCard}>
        <p className={sectionLabel}>Money to receive</p>
        <div className={`${valueHero} mt-2.5`}>
          <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl xl:text-[1.2rem] xl:leading-tight">
            {formatMoney(kpis.moneyToReceive, "INR")}
          </p>
        </div>
        <p className="mt-auto pt-2 text-[10px] leading-snug text-purity-muted">Still due on money you lent</p>
      </article>

      <article className={`${kpiCard} ring-slate-300/50`}>
        <p className={sectionLabel}>Monthly burn</p>
        <div className={`${valueHero} mt-2.5 bg-gradient-to-b from-slate-50/90 to-slate-100/80`}>
          <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900 sm:text-xl xl:text-[1.2rem] xl:leading-tight">
            {formatMoney(kpis.monthlyBurn, "INR")}
          </p>
        </div>
        <Trend meta={kpis.momBurn} invert suffix="vs prior burn proxy" />
        <p className="mt-auto pt-2 text-[10px] leading-snug text-purity-muted">Avg monthly spend (3 mo, excl. transfers)</p>
      </article>
    </section>
  );
}
