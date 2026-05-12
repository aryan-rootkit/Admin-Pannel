"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FinanceAnalytics, MonthlyAnalyticsRow } from "@/types/api";
import { formatMoney } from "@/lib/format";
import { glassCard, sectionLabel } from "@/components/dashboard/dashboardStyles";

function signedClass(n: number): string {
  if (n > 0) return "text-emerald-400";
  if (n < 0) return "text-rose-400";
  return "text-purity-text";
}

type Props = {
  finance: FinanceAnalytics | null;
  monthly: MonthlyAnalyticsRow[];
  statusSlices: { name: string; value: number; fill: string }[];
  loading: boolean;
  error: string | null;
};

export function DashboardRevenueIntel({
  finance,
  monthly,
  statusSlices,
  loading,
  error,
}: Props) {
  const chartData = Array.isArray(monthly) ? monthly : [];
  const last6 = chartData.slice(-6);
  const breakdown = finance?.projectBreakdown ?? [];

  if (loading) {
    return (
      <section aria-label="Revenue intelligence" className="space-y-6">
        <h2 className={sectionLabel}>Revenue intelligence</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className={`${glassCard} h-[320px] animate-pulse p-5`} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="Revenue intelligence">
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      </section>
    );
  }

  if (!finance) return null;

  const donutData = statusSlices.filter((s) => s.value > 0);

  return (
    <section aria-label="Revenue intelligence" className="space-y-6">
      <div>
        <h2 className={sectionLabel}>Revenue intelligence</h2>
        <p className="mt-1 text-sm text-purity-muted">
          Received vs pending, costs, and portfolio shape — compact analytics
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5 lg:items-stretch">
        <div className={`${glassCard} min-h-[300px] p-5 lg:col-span-3`}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className={sectionLabel}>Trend</p>
              <p className="text-sm font-medium text-purity-text">Income vs payout outflows</p>
            </div>
          </div>
          {!chartData.length ? (
            <p className="text-sm text-purity-muted">No monthly data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(v) => {
                    const n = Number(v);
                    if (!Number.isFinite(n)) return "";
                    if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
                    if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
                    return `₹${Math.round(n)}`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,23,42,0.95)",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: "12px",
                  }}
                  formatter={(value, name) => [formatMoney(Number(value), "INR"), String(name ?? "")]}
                />
                <Line type="monotone" dataKey="revenue" name="Received" stroke="#22d3ee" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cost" name="Payouts" stroke="#fb923c" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="profit" name="Net (month)" stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={`${glassCard} flex min-h-[300px] flex-col p-5 lg:col-span-2`}>
          <p className={sectionLabel}>Portfolio</p>
          <p className="text-sm font-medium text-purity-text">Projects by status</p>
          <div className="mt-4 flex min-h-0 flex-1 items-center justify-center">
            {!donutData.length ? (
              <p className="text-sm text-purity-muted">No projects yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} stroke="rgba(15,23,42,0.8)" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(148,163,184,0.2)",
                      borderRadius: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className={`${glassCard} p-5`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className={sectionLabel}>Last 6 months</p>
            <p className="text-sm font-medium text-purity-text">Received revenue vs total payout volume</p>
          </div>
        </div>
        {!last6.length ? (
          <p className="text-sm text-purity-muted">No data.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={last6} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.95)",
                  border: "1px solid rgba(148,163,184,0.2)",
                  borderRadius: "12px",
                }}
                formatter={(v) => formatMoney(Number(v), "INR")}
              />
              <Bar dataKey="revenue" name="Received" fill="#22d3ee" radius={[6, 6, 0, 0]} maxBarSize={36} />
              <Bar dataKey="cost" name="Payouts" fill="#fb923c" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={`${glassCard} overflow-hidden p-5`}>
        <p className={sectionLabel}>Project breakdown</p>
        <p className="mt-1 text-sm text-purity-muted">Received, pending, cancelled balance, cost, profit</p>
        {!breakdown.length ? (
          <p className="mt-4 text-sm text-purity-muted">No projects yet.</p>
        ) : (
          <div className="-mx-1 mt-4 max-h-[min(24rem,55vh)] min-w-0 overflow-auto px-1">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="sticky top-0 z-[1] border-b border-purity-border bg-purity-card text-[10px] font-bold uppercase tracking-wider text-purity-muted">
                <tr>
                  <th className="pb-2 pr-3">Project</th>
                  <th className="pb-2 pr-3 text-right">Contract</th>
                  <th className="pb-2 pr-3 text-right">Received</th>
                  <th className="pb-2 pr-3 text-right">Pending</th>
                  <th className="pb-2 pr-3 text-right">Cancelled</th>
                  <th className="pb-2 pr-3 text-right">Cost</th>
                  <th className="pb-2 text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {[...breakdown]
                  .sort((a, b) => (b.projectProfit ?? 0) - (a.projectProfit ?? 0))
                  .map((row) => (
                    <tr key={row.projectId} className="border-t border-purity-border">
                      <td className="py-2.5 pr-3 font-medium">{row.projectName || "—"}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{formatMoney(row.totalValue, "INR")}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{formatMoney(row.totalReceived, "INR")}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{formatMoney(row.pending, "INR")}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-amber-200/90">
                        {formatMoney(row.cancelledBalance ?? 0, "INR")}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{formatMoney(row.projectCost, "INR")}</td>
                      <td className={`py-2.5 text-right tabular-nums font-semibold ${signedClass(row.projectProfit)}`}>
                        {formatMoney(row.projectProfit, "INR")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
