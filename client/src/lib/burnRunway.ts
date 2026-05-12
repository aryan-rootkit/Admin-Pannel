import type { FinanceAnalytics, MonthlyAnalyticsRow } from "@/types/api";

/** Spread recorded “subscriptions & other” into a monthly operating slice (heuristic). */
function monthlyOpexSlice(finance: FinanceAnalytics): number {
  const t = Number(finance.totalExpenses) || 0;
  return t / 12;
}

function lastTwoMonthly(monthly: MonthlyAnalyticsRow[]): {
  last: MonthlyAnalyticsRow | null;
  prev: MonthlyAnalyticsRow | null;
} {
  const m = Array.isArray(monthly) ? monthly : [];
  if (m.length === 0) return { last: null, prev: null };
  if (m.length === 1) return { last: m[m.length - 1] ?? null, prev: null };
  return { last: m[m.length - 1] ?? null, prev: m[m.length - 2] ?? null };
}

export type BurnRunwaySnapshot = {
  /** Last month payout outflow + monthly opex slice */
  monthlyBurn: number;
  monthlyBurnPrev: number | null;
  /** MoM % change in monthly burn; null if no prior */
  monthlyBurnMomPct: number | null;
  /** Last month cost line only (project payout volume) */
  operationalBurn: number;
  operationalBurnPrev: number | null;
  /** MoM % on operational burn only */
  operationalMomPct: number | null;
  /** pending ÷ monthly burn when burn > 0 */
  runwayMonthsFromPending: number | null;
  /** Composite “expense velocity”: MoM change on (cost + opex slice) */
  expenseVelocityPct: number | null;
};

export function computeBurnRunway(
  finance: FinanceAnalytics | null,
  monthly: MonthlyAnalyticsRow[]
): BurnRunwaySnapshot | null {
  if (!finance) return null;
  const opex = monthlyOpexSlice(finance);
  const { last, prev } = lastTwoMonthly(monthly);

  const lastCost = last ? Number(last.cost) || 0 : 0;
  const prevCost = prev ? Number(prev.cost) || 0 : 0;

  const monthlyBurn = lastCost + opex;
  const monthlyBurnPrev = prev != null ? prevCost + opex : null;

  const pct = (cur: number, p: number | null): number | null => {
    if (p == null) return null;
    if (p === 0) return cur > 0 ? 100 : null;
    return ((cur - p) / p) * 100;
  };

  const monthlyBurnMomPct = pct(monthlyBurn, monthlyBurnPrev);

  const operationalMomPct = pct(lastCost, prev != null ? prevCost : null);

  const runwayMonthsFromPending =
    monthlyBurn > 0 ? (Number(finance.pendingRevenue) || 0) / monthlyBurn : null;

  const expenseVelocityPct = monthlyBurnMomPct;

  return {
    monthlyBurn,
    monthlyBurnPrev,
    monthlyBurnMomPct,
    operationalBurn: lastCost,
    operationalBurnPrev: prev != null ? prevCost : null,
    operationalMomPct,
    runwayMonthsFromPending,
    expenseVelocityPct,
  };
}
