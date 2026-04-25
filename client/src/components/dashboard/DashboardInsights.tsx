"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyAnalyticsRow, ProfitAnalytics } from "@/types/api";
import { Spinner } from "@/components/ui/Spinner";

const cardClass =
  "rounded-xl border border-[var(--purity-border)] bg-[var(--purity-card)] p-5 shadow-sm";

export function formatInr(value: number): string {
  return `₹${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

type Props = {
  profit: ProfitAnalytics | null;
  monthly: MonthlyAnalyticsRow[];
  loading: boolean;
  error: string | null;
};

export function DashboardInsights({ profit, monthly, loading, error }: Props) {
  const chartData = Array.isArray(monthly) ? monthly : [];

  return (
    <section className="mt-10 space-y-8">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--purity-muted)]">
        Profit and trends
      </h2>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--purity-muted)]">
          <Spinner />
          Loading analytics…
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      {!loading && !error && profit ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={cardClass}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                Total revenue
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--purity-text)]">
                {formatInr(profit.totalRevenue)}
              </p>
            </div>
            <div className={cardClass}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                Total cost
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--purity-text)]">
                {formatInr(profit.totalCost)}
              </p>
              <p className="mt-1 text-xs text-[var(--purity-muted)]">
                Payouts (all) + weekly labour (hourly × hours this week)
              </p>
              <p className="mt-0.5 text-[10px] text-[var(--purity-muted)]">
                Payouts {formatInr(profit.totalPayoutCost ?? 0)} · Labour{" "}
                {formatInr(profit.totalLabourCost ?? 0)}
              </p>
            </div>
            <div className={cardClass}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                Profit
              </p>
              <p
                className={`mt-2 text-2xl font-bold ${
                  profit.profit >= 0 ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {formatInr(profit.profit)}
              </p>
            </div>
          </div>

          <div className={cardClass}>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
              Monthly trend (revenue vs payout cost)
            </p>
            {!chartData.length ? (
              <p className="text-sm text-[var(--purity-muted)]">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--purity-border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => {
                      const n = Number(v);
                      if (!Number.isFinite(n)) return "";
                      if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
                      if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
                      return `₹${Math.round(n)}`;
                    }}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatInr(Number(value)),
                      String(name ?? ""),
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    name="Cost (payouts)"
                    stroke="#ea580c"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            <p className="mt-3 text-xs text-[var(--purity-muted)]">
              Monthly revenue uses payment / received / created dates. Monthly cost sums payout
              amounts in each month (labour not logged as payouts will not appear).
            </p>
          </div>

          {profit.projectBreakdown.length > 0 ? (
            <div className={cardClass}>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                Cost by project (payouts linked to project + weekly labour on roster)
              </p>
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[var(--purity-card)] text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                    <tr>
                      <th className="pb-2 pr-2">Project</th>
                      <th className="pb-2 pr-2 text-right">Payouts</th>
                      <th className="pb-2 pr-2 text-right">Labour</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--purity-text)]">
                    {[...profit.projectBreakdown]
                      .sort((a, b) => b.totalCost - a.totalCost)
                      .map((row) => (
                        <tr
                          key={row.projectId}
                          className="border-t border-[var(--purity-border)]"
                        >
                          <td className="py-2 pr-2">{row.projectName || "—"}</td>
                          <td className="py-2 pr-2 text-right tabular-nums text-xs">
                            {formatInr(row.payoutCost ?? 0)}
                          </td>
                          <td className="py-2 pr-2 text-right tabular-nums text-xs">
                            {formatInr(row.labourCost ?? 0)}
                          </td>
                          <td className="py-2 text-right tabular-nums font-medium">
                            {formatInr(row.totalCost)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
