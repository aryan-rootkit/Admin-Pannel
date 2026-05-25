"use client";

import { formatMoney } from "@/lib/format";
import { glassCard, kpiCard, sectionLabel, sectionTitle, valueHero } from "@/components/dashboard/dashboardStyles";
import type { PfLinkedFlows } from "@/types/personalFinance";

function MomBadge({ pct }: { pct: number | null | undefined }) {
  if (pct == null || !Number.isFinite(pct)) return null;
  const up = pct >= 0;
  return (
    <p className={`mt-1 text-[10px] font-semibold tabular-nums ${up ? "text-emerald-600" : "text-rose-600"}`}>
      {up ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}% vs last month
    </p>
  );
}

type Props = {
  data: PfLinkedFlows | null | undefined;
  monthLabel: string;
};

export function PfLinkedFlowsSection({ data, monthLabel }: Props) {
  if (!data?.cards) return null;

  const { rootkitEarnings, personalWithdrawals, paidToPerson, businessToPersonal } = data.cards;
  const hasAny =
    (rootkitEarnings.amount ?? 0) > 0 ||
    (personalWithdrawals.amount ?? 0) > 0 ||
    (paidToPerson.totalPaid ?? 0) > 0 ||
    (businessToPersonal.amount ?? 0) > 0 ||
    (paidToPerson.pending ?? 0) > 0;

  if (!hasAny && data.personalRelatedPeople.length === 0) return null;

  return (
    <section aria-label="Linked business flows" className={`${glassCard} overflow-hidden`}>
      <div className="border-b border-slate-100 bg-gradient-to-b from-violet-50/40 to-white px-5 py-4 md:px-6">
        <p className={sectionLabel}>Auto-linked · {monthLabel}</p>
        <h2 className={`${sectionTitle} mt-1`}>From Revenues, Payouts & People</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Pulled from existing app data — no duplicate entry. Rootkit income, owner drawings, and payouts to
          configured contacts update when you change Revenues or Payouts.
        </p>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 lg:grid-cols-4">
        <article className={`${kpiCard} p-4!`}>
          <p className={sectionLabel}>{rootkitEarnings.label}</p>
          <div className={`${valueHero} mt-2`}>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900">
              {formatMoney(rootkitEarnings.amount ?? 0, "INR")}
            </p>
          </div>
          <MomBadge pct={rootkitEarnings.momPct} />
          <p className="mt-2 text-[10px] leading-snug text-purity-muted">
            {rootkitEarnings.lineCount ?? 0} Rootkit-tagged revenue line
            {(rootkitEarnings.lineCount ?? 0) === 1 ? "" : "s"} this month
          </p>
        </article>

        <article className={`${kpiCard} p-4!`}>
          <p className={sectionLabel}>{personalWithdrawals.label}</p>
          <div className={`${valueHero} mt-2`}>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900">
              {formatMoney(personalWithdrawals.amount ?? 0, "INR")}
            </p>
          </div>
          <p className="mt-2 text-[10px] leading-snug text-purity-muted">
            Owner {formatMoney(personalWithdrawals.ownerDrawings ?? 0, "INR")} · transfers{" "}
            {formatMoney(personalWithdrawals.businessToPersonal ?? 0, "INR")}
          </p>
        </article>

        <article className={`${kpiCard} p-4! ring-2 ring-indigo-200/70`}>
          <p className={sectionLabel}>{paidToPerson.label}</p>
          <div className={`${valueHero} mt-2 from-indigo-50/80 to-white`}>
            <p className="text-lg font-bold tabular-nums tracking-tight text-indigo-950">
              {formatMoney(paidToPerson.totalPaid ?? 0, "INR")}
            </p>
          </div>
          <p className="mt-2 text-[10px] leading-snug text-purity-muted">
            {formatMoney(paidToPerson.paidThisMonth ?? 0, "INR")} this month
            {(paidToPerson.pending ?? 0) > 0
              ? ` · ₹${Math.round(paidToPerson.pending ?? 0).toLocaleString("en-IN")} pending`
              : ""}
          </p>
        </article>

        <article className={`${kpiCard} p-4!`}>
          <p className={sectionLabel}>{businessToPersonal.label}</p>
          <div className={`${valueHero} mt-2`}>
            <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900">
              {formatMoney(businessToPersonal.amount ?? 0, "INR")}
            </p>
          </div>
          <p className="mt-2 text-[10px] leading-snug text-purity-muted">
            {businessToPersonal.lineCount ?? 0} transfer line
            {(businessToPersonal.lineCount ?? 0) === 1 ? "" : "s"} this month
          </p>
        </article>
      </div>
    </section>
  );
}
