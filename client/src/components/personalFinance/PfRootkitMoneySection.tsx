"use client";

import { formatMoney } from "@/lib/format";
import { glassCard, kpiCard, sectionLabel, sectionTitle, valueHero } from "@/components/dashboard/dashboardStyles";
import type { PfMomMeta, PfRootkitBusiness } from "@/types/personalFinance";

function Trend({ meta, invert }: { meta: PfMomMeta; invert?: boolean }) {
  if (meta.pct == null || !Number.isFinite(meta.pct)) {
    return <p className="mt-1 text-[10px] text-purity-muted">No prior month</p>;
  }
  const up = meta.pct >= 0;
  const good = invert ? !up : up;
  return (
    <p
      className={`mt-1 text-[10px] font-semibold tabular-nums ${
        good ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      {up ? "↑" : "↓"} {Math.abs(meta.pct).toFixed(1)}% vs last month
    </p>
  );
}

type Props = {
  data: PfRootkitBusiness | null | undefined;
  monthLabel: string;
};

export function PfRootkitMoneySection({ data, monthLabel }: Props) {
  if (!data) return null;

  const savingsPositive = data.estimatedSavings >= 0;

  return (
    <section aria-label="Rootkit business vs personal spend" className={`${glassCard} overflow-hidden`}>
      <div className="border-b border-slate-100 bg-gradient-to-b from-[#e8f0fe]/50 to-white px-5 py-4 md:px-6">
        <p className={sectionLabel}>Your money · Rootkit</p>
        <h2 className={`${sectionTitle} mt-1`}>Business margin vs personal spend</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          See what Rootkit earned after project payouts in{" "}
          <span className="font-medium text-slate-800">{monthLabel}</span>, how much you spent personally,
          and what may be left to save — same logic as Payouts &ldquo;Left with Rootkit&rdquo; (rev − all project payouts).
        </p>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 lg:grid-cols-4">
        <article className={`${kpiCard} p-4!`}>
          <p className={sectionLabel}>Rootkit margin</p>
          <div className={`${valueHero} mt-2`}>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900">
              {formatMoney(data.rootkitMargin, "INR")}
            </p>
          </div>
          <Trend meta={data.momMargin} />
          <p className="mt-2 text-[10px] leading-snug text-purity-muted">
            Rev {formatMoney(data.revenueReceived, "INR")} − project payouts{" "}
            {formatMoney(data.projectPayoutCost, "INR")} ({data.projectPayoutLineCount} lines)
          </p>
        </article>

        <article className={`${kpiCard} p-4!`}>
          <p className={sectionLabel}>Business net</p>
          <div className={`${valueHero} mt-2`}>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900">
              {formatMoney(data.rootkitNet, "INR")}
            </p>
          </div>
          <Trend meta={data.momNet} />
          <p className="mt-2 text-[10px] leading-snug text-purity-muted">
            Margin minus company subs & expenses ({formatMoney(data.operatingExpenses, "INR")})
          </p>
        </article>

        <article className={`${kpiCard} p-4!`}>
          <p className={sectionLabel}>Personal spend</p>
          <div className={`${valueHero} mt-2`}>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900">
              {formatMoney(data.personalSpend, "INR")}
            </p>
          </div>
          <p className="mt-2 text-[10px] leading-snug text-purity-muted">
            Your ledger outflows this month (excl. transfers)
          </p>
        </article>

        <article
          className={`${kpiCard} p-4! ring-2 ${
            savingsPositive ? "ring-emerald-200/80" : "ring-rose-200/80"
          }`}
        >
          <p className={sectionLabel}>Est. kept / savings</p>
          <div
            className={`${valueHero} mt-2 ${
              savingsPositive
                ? "from-emerald-50/90 to-white"
                : "from-rose-50/90 to-white"
            }`}
          >
            <p
              className={`text-lg font-bold tabular-nums tracking-tight ${
                savingsPositive ? "text-emerald-900" : "text-rose-900"
              }`}
            >
              {formatMoney(data.estimatedSavings, "INR")}
            </p>
          </div>
          <p className="mt-2 text-[10px] leading-snug text-purity-muted">
            Business net − personal spend
            {data.spendRatePct != null && data.rootkitNet > 0
              ? ` · ${data.spendRatePct.toFixed(0)}% of business net`
              : ""}
          </p>
          {data.ledgerRootkitIncome > 0 ? (
            <p className="mt-1 text-[10px] text-purity-muted">
              Ledger rootkit_income: {formatMoney(data.ledgerRootkitIncome, "INR")}
            </p>
          ) : null}
        </article>
      </div>
    </section>
  );
}
