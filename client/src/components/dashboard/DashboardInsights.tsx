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
import type { FinanceAnalytics, MonthlyAnalyticsRow } from "@/types/api";
import { Spinner } from "@/components/ui/Spinner";

const cardClass =
  "rounded-xl border border-[var(--purity-border)] bg-[var(--purity-card)] p-5 shadow-sm";

export function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function signedAmountClass(n: number): string {
  if (n > 0) return "text-emerald-700";
  if (n < 0) return "text-red-700";
  return "text-[var(--purity-text)]";
}

type Props = {
  finance: FinanceAnalytics | null;
  monthly: MonthlyAnalyticsRow[];
  loading: boolean;
  error: string | null;
};

export function DashboardInsights({ finance, monthly, loading, error }: Props) {
  const chartData = Array.isArray(monthly) ? monthly : [];
  const breakdown = finance?.projectBreakdown ?? [];

  return (
    <section className="mt-10 space-y-8">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--purity-muted)]">
        Finance overview
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

      {!loading && !error && finance ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className={cardClass}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                Total revenue
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--purity-text)]">
                {formatInr(finance.totalRevenue)}
              </p>
              <p className="mt-1 text-xs text-[var(--purity-muted)]">
                Sum of payment lines with status Received
              </p>
            </div>
            <div className={cardClass}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                Project cost
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--purity-text)]">
                {formatInr(finance.totalProjectCost)}
              </p>
              <p className="mt-1 text-xs text-[var(--purity-muted)]">
                Payouts excluding subscriptions and company expenses
              </p>
            </div>
            <div className={cardClass}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                Expenses
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--purity-text)]">
                {formatInr(finance.totalExpenses)}
              </p>
              <p className="mt-1 text-xs text-[var(--purity-muted)]">
                Subscriptions, tools, and company expense payouts
              </p>
            </div>
            <div className={cardClass}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                Net profit
              </p>
              <p
                className={`mt-2 text-2xl font-bold tabular-nums ${signedAmountClass(finance.netProfit)}`}
              >
                {formatInr(finance.netProfit)}
              </p>
              <p className="mt-1 text-xs text-[var(--purity-muted)]">
                After operating expenses. Gross project profit:{" "}
                <span className={`font-semibold tabular-nums ${signedAmountClass(finance.projectProfit)}`}>
                  {formatInr(finance.projectProfit)}
                </span>{" "}
                (revenue − project cost)
              </p>
            </div>
            <div className={cardClass}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                Pending revenue
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--purity-text)]">
                {formatInr(finance.pendingRevenue)}
              </p>
              <p className="mt-1 text-xs text-[var(--purity-muted)]">
                Contract value not yet received (per project)
              </p>
            </div>
          </div>

          <div className={cardClass}>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
              Monthly trend (received revenue vs payout cost)
            </p>
            {!chartData.length ? (
              <p className="text-sm text-[var(--purity-muted)]">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
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
                    formatter={(value, name) => [formatInr(Number(value)), String(name ?? "")]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue (received)"
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
              Monthly revenue uses received payment dates only. Cost sums payout amounts by month.
            </p>
          </div>

          <div className={cardClass}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
              Project breakdown
            </p>
            {!breakdown.length ? (
              <p className="text-sm text-[var(--purity-muted)]">No projects yet.</p>
            ) : (
              <div className="max-h-[28rem] overflow-x-auto overflow-y-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="sticky top-0 z-[1] border-b border-[var(--purity-border)] bg-[var(--purity-card)] text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                    <tr>
                      <th className="pb-2 pr-3">Project</th>
                      <th className="pb-2 pr-3 text-right">Total value</th>
                      <th className="pb-2 pr-3 text-right">Received</th>
                      <th className="pb-2 pr-3 text-right">Pending (collectible)</th>
                      <th className="pb-2 pr-3 text-right">Cancelled bal.</th>
                      <th className="pb-2 pr-3 text-right">Cost</th>
                      <th className="pb-2 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--purity-text)]">
                    {[...breakdown]
                      .sort((a, b) => (b.projectProfit ?? 0) - (a.projectProfit ?? 0))
                      .map((row) => (
                        <tr key={row.projectId} className="border-t border-[var(--purity-border)]">
                          <td className="py-2.5 pr-3 font-medium">{row.projectName || "—"}</td>
                          <td className="py-2.5 pr-3 text-right tabular-nums">
                            {formatInr(row.totalValue)}
                          </td>
                          <td className="py-2.5 pr-3 text-right tabular-nums">
                            {formatInr(row.totalReceived)}
                          </td>
                          <td
                            className={`py-2.5 pr-3 text-right tabular-nums ${row.pending < 0 ? "text-red-700" : ""}`}
                          >
                            {formatInr(row.pending)}
                          </td>
                          <td className="py-2.5 pr-3 text-right tabular-nums text-amber-800 dark:text-amber-200">
                            {formatInr(row.cancelledBalance ?? 0)}
                          </td>
                          <td className="py-2.5 pr-3 text-right tabular-nums">
                            {formatInr(row.projectCost)}
                          </td>
                          <td
                            className={`py-2.5 text-right tabular-nums font-semibold ${signedAmountClass(row.projectProfit)}`}
                          >
                            {formatInr(row.projectProfit)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
