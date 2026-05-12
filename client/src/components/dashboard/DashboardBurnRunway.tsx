"use client";

import { formatMoney } from "@/lib/format";
import type { BurnRunwayIntel } from "@/lib/dashboardBurn";
import { glassCard, sectionLabel, cardPadding } from "@/components/dashboard/dashboardStyles";

type Props = {
  intel: BurnRunwayIntel | null;
};

function MiniTrend({ pct }: { pct: number | null }) {
  if (pct == null || !Number.isFinite(pct)) {
    return <span className="text-[11px] text-slate-500">No prior month</span>;
  }
  const up = pct >= 0;
  const bad = up;
  const arrow = up ? "↑" : "↓";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums ${bad ? "text-rose-600" : "text-emerald-600"}`}>
      <span aria-hidden>{arrow}</span>
      {Math.abs(pct).toFixed(1)}% <span className="font-normal text-slate-500">on payouts</span>
    </span>
  );
}

export function DashboardBurnRunway({ intel }: Props) {
  if (!intel) return null;

  return (
    <section aria-label="Burn and runway intelligence">
      <div
        className={`${glassCard} relative overflow-hidden border-l-[4px] border-l-indigo-500 bg-gradient-to-br from-white via-indigo-50/40 to-slate-50/90 shadow-[0_12px_40px_-18px_rgba(79,70,229,0.25)] ring-1 ring-indigo-100/80 ${cardPadding}`}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-400/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={sectionLabel}>Liquidity &amp; burn</p>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Operating intelligence</h3>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-600">
              Payout pace, expense velocity, and receivable coverage — no bank balance assumed.
            </p>
          </div>
          <div className="rounded-full bg-indigo-600/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-800 ring-1 ring-indigo-200/60">
            CFO view
          </div>
        </div>

        <div className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100/80">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Monthly burn</p>
            <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-slate-900">
              {formatMoney(intel.monthlyBurn, "INR")}
            </p>
            <p className="mt-2">
              <MiniTrend pct={intel.burnMomPct} />
            </p>
            <p className="mt-2 text-[11px] leading-snug text-slate-500">Latest month payout outflow</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100/80">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Operational burn</p>
            <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-slate-900">
              {formatMoney(intel.operationalBurn, "INR")}
            </p>
            <p className="mt-2 text-[11px] text-slate-500">3‑month avg. outflows</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100/80 sm:col-span-2 lg:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Pending cover</p>
            <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-slate-900">
              {intel.pendingCoverageMonths != null && intel.pendingCoverageMonths > 0
                ? `${intel.pendingCoverageMonths.toFixed(1)} mo`
                : "—"}
            </p>
            <p className="mt-2 text-[11px] text-slate-500">Outstanding ÷ latest payout pace</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100/80 sm:col-span-2 lg:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Runway read</p>
            <p className="mt-2 text-base font-bold leading-snug text-indigo-950">{intel.runwayHeadline}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{intel.runwaySub}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
