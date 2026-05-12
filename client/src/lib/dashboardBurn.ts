import type { FinanceAnalytics, MonthlyAnalyticsRow } from "@/types/api";
import type { MomMeta } from "@/lib/dashboardIntelligence";

export type BurnRunwayIntel = {
  /** Latest month payout / cost outflow from monthly series */
  monthlyBurn: number;
  /** Rolling average of last up-to-3 months `cost` */
  operationalBurn: number;
  /** Month-over-month % change on latest month cost (null if not comparable) */
  burnMomPct: number | null;
  /** Pending revenue ÷ monthly burn — collections runway hint */
  pendingCoverageMonths: number | null;
  /** Avg net (last 3 months) ÷ operational burn when net negative */
  deficitRunwayMonths: number | null;
  /** Short copy for runway card */
  runwayHeadline: string;
  runwaySub: string;
};

function mean(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * CFO-style burn / runway hints from finance snapshot + monthly cost series.
 * Does not assume bank cash — uses receivables and monthly outflows only.
 */
export function computeBurnRunwayIntel(
  finance: FinanceAnalytics | null,
  monthly: MonthlyAnalyticsRow[],
  momCost: MomMeta
): BurnRunwayIntel | null {
  if (!finance) return null;

  const m = Array.isArray(monthly) ? monthly : [];
  const last3 = m.slice(-3);
  const last = m[m.length - 1];
  const monthlyBurn = last ? last.cost : 0;
  const costs = last3.map((row) => row.cost).filter((c) => Number.isFinite(c));
  const operationalBurn = costs.length ? mean(costs) : monthlyBurn;

  const burnMomPct = momCost.pct;

  let pendingCoverageMonths: number | null = null;
  if (monthlyBurn > 0 && finance.pendingRevenue > 0) {
    pendingCoverageMonths = finance.pendingRevenue / monthlyBurn;
  }

  const last3Profit = last3.map((row) => row.profit).filter((p) => Number.isFinite(p));
  const avgNet = last3Profit.length ? mean(last3Profit) : 0;
  let deficitRunwayMonths: number | null = null;
  if (avgNet < 0 && operationalBurn > 0) {
    deficitRunwayMonths = Math.abs(avgNet) / operationalBurn;
  }

  let runwayHeadline = "Runway signal";
  let runwaySub = "Based on monthly outflows vs receivables and recent net.";

  if (pendingCoverageMonths != null && pendingCoverageMonths > 0) {
    runwayHeadline = `${pendingCoverageMonths.toFixed(1)} mo pending cover`;
    runwaySub = "Outstanding revenue ÷ latest month payout pace.";
  } else if (deficitRunwayMonths != null && deficitRunwayMonths > 0 && avgNet < 0) {
    runwayHeadline = `${deficitRunwayMonths.toFixed(1)} mo burn pressure`;
    runwaySub = "Recent avg. net loss vs average monthly outflows.";
  } else if (avgNet >= 0 && operationalBurn > 0) {
    runwayHeadline = "Self-funding pace";
    runwaySub = "Recent months net at or above zero vs outflows.";
  }

  return {
    monthlyBurn,
    operationalBurn,
    burnMomPct,
    pendingCoverageMonths,
    deficitRunwayMonths,
    runwayHeadline,
    runwaySub,
  };
}
