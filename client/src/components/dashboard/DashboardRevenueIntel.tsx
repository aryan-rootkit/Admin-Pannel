"use client";

import { memo } from "react";
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
import { glassCard, sectionLabel, cardPadding } from "@/components/dashboard/dashboardStyles";

const ACCENT = "#2563eb";
const COST = "#ea580c";
const NET = "#7c3aed";

const tooltipLight = {
  background: "#ffffff",
  border: "1px solid rgba(148,163,184,0.35)",
  borderRadius: "12px",
  color: "#0f172a",
  boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
};

function signedClass(n: number): string {
  if (n > 0) return "text-emerald-600";
  if (n < 0) return "text-rose-600";
  return "text-purity-text";
}

type Props = {
  finance: FinanceAnalytics | null;
  monthly: MonthlyAnalyticsRow[];
  statusSlices: { name: string; value: number; fill: string }[];
  loading: boolean;
  error: string | null;
};

function DashboardRevenueIntelInner({
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
      <section aria-label="Revenue intelligence" className="space-y-5">
        <h2 className={sectionLabel}>Revenue intelligence</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className={`${glassCard} h-[320px] animate-pulse ${cardPadding}`} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="Revenue intelligence">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      </section>
    );
  }

  if (!finance) return null;

  const donutData = statusSlices.filter((s) => s.value > 0);

  return (
    <section aria-label="Revenue intelligence" className="space-y-4">
      <div>
        <h2 className={sectionLabel}>Revenue intelligence</h2>
      </div>

      <div className="grid min-h-0 min-w-0 gap-4 lg:grid-cols-5 lg:items-stretch">
        <div className={`${glassCard} min-h-[300px] min-w-0 lg:col-span-3 ${cardPadding}`}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className={sectionLabel}>Trend</p>
              <p className="text-sm font-medium text-purity-text">Income vs payout outflows</p>
            </div>
          </div>
          {!chartData.length ? (
            <p className="text-sm text-purity-muted">No monthly data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
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
                <Tooltip contentStyle={tooltipLight} formatter={(value, name) => [formatMoney(Number(value), "INR"), String(name ?? "")]} />
                <Line type="monotone" dataKey="revenue" name="Received" stroke={ACCENT} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cost" name="Payouts" stroke={COST} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="profit" name="Net (month)" stroke={NET} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={`${glassCard} flex min-h-[280px] min-w-0 flex-col lg:col-span-2 ${cardPadding}`}>
          <p className={sectionLabel}>Portfolio</p>
          <p className="text-sm font-medium text-purity-text">Projects by status</p>
          <div className="mt-4 flex min-h-0 flex-1 items-center justify-center">
            {!donutData.length ? (
              <p className="text-sm text-purity-muted">No projects yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
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
                      <Cell key={i} fill={entry.fill} stroke="#e2e8f0" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipLight} />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "#64748b" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className={`${glassCard} min-h-0 min-w-0 p-4 md:p-5`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className={sectionLabel}>Last 6 months</p>
            <p className="text-xs font-medium text-purity-text">Received revenue vs total payout volume</p>
          </div>
        </div>
        {!last6.length ? (
          <p className="text-sm text-purity-muted">No data.</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={last6} margin={{ top: 4, right: 4, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} width={36} />
              <Tooltip contentStyle={tooltipLight} formatter={(v) => formatMoney(Number(v), "INR")} />
              <Bar dataKey="revenue" name="Received" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={26} />
              <Bar dataKey="cost" name="Payouts" fill={COST} radius={[4, 4, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={`${glassCard} min-h-0 min-w-0 overflow-hidden p-4 md:p-5`}>
        <p className={sectionLabel}>Project breakdown</p>
        <p className="mt-0.5 text-xs text-purity-muted">Received, pending, cancelled balance, cost, profit</p>
        {!breakdown.length ? (
          <p className="mt-3 text-sm text-purity-muted">No projects yet.</p>
        ) : (
          <div className="-mx-1 mt-3 min-w-0 overflow-x-auto px-1 pb-1">
            <table className="w-full min-w-[34rem] text-left text-xs">
              <thead className="border-b border-purity-border bg-white text-[9px] font-bold uppercase tracking-wider text-purity-muted">
                <tr>
                  <th className="pb-1.5 pr-2">Project</th>
                  <th className="pb-1.5 pr-2 text-right">Contract</th>
                  <th className="pb-1.5 pr-2 text-right">Received</th>
                  <th className="pb-1.5 pr-2 text-right">Pending</th>
                  <th className="pb-1.5 pr-2 text-right">Cancelled</th>
                  <th className="pb-1.5 pr-2 text-right">Cost</th>
                  <th className="pb-1.5 text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {[...breakdown]
                  .sort((a, b) => (b.projectProfit ?? 0) - (a.projectProfit ?? 0))
                  .map((row) => (
                    <tr key={row.projectId} className="border-t border-purity-border">
                      <td className="py-2 pr-2 font-medium">{row.projectName || "—"}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{formatMoney(row.totalValue, "INR")}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{formatMoney(row.totalReceived, "INR")}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{formatMoney(row.pending, "INR")}</td>
                      <td className="py-2 pr-2 text-right tabular-nums text-amber-700">
                        {formatMoney(row.cancelledBalance ?? 0, "INR")}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">{formatMoney(row.projectCost, "INR")}</td>
                      <td className={`py-2 text-right tabular-nums font-semibold ${signedClass(row.projectProfit)}`}>
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

export const DashboardRevenueIntel = memo(DashboardRevenueIntelInner);
