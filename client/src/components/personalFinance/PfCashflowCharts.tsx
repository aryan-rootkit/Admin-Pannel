"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { glassCard, sectionLabel, sectionTitle } from "@/components/dashboard/dashboardStyles";
import { formatMoney } from "@/lib/format";
import type { PfCashflowMonth, PfCategorySlice } from "@/types/personalFinance";

const PIE_COLORS = ["#1a56db", "#0d9488", "#c026d3", "#ea580c", "#ca8a04", "#64748b", "#334155"];

type Props = {
  series: PfCashflowMonth[];
  categories: PfCategorySlice[];
};

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value?: number; name?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-800">{label}</p>
      {payload.map((p) => (
        <p key={String(p.name)} className="tabular-nums text-slate-600">
          {p.name}: {formatMoney(Number(p.value) || 0, "INR")}
        </p>
      ))}
    </div>
  );
}

export function PfCashflowCharts({ series, categories }: Props) {
  const pieData = categories.slice(0, 8).map((c) => ({ name: c.name, value: c.amount }));

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className={`${glassCard} p-5 md:p-6 lg:col-span-3`}>
        <p className={sectionLabel}>Cashflow</p>
        <h3 className={`${sectionTitle} mt-1`}>Money in vs out (6 months)</h3>
        <div className="mt-4 h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="inflow" name="In" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="outflow" name="Out" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${glassCard} p-5 md:p-6 lg:col-span-2`}>
        <p className={sectionLabel}>This month</p>
        <h3 className={`${sectionTitle} mt-1`}>Expense mix</h3>
        <div className="mt-2 h-[220px] w-full min-w-0">
          {pieData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={2}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="white" strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatMoney(Number(value) || 0, "INR"), "Amount"]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">No expense data this month</p>
          )}
        </div>
        <div className="mt-3 space-y-1.5 text-xs text-slate-600">
          {categories.slice(0, 5).map((c) => (
            <div key={c.name} className="flex justify-between gap-2 tabular-nums">
              <span className="truncate font-medium capitalize">{c.name}</span>
              <span>{formatMoney(c.amount, "INR")}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`${glassCard} p-5 md:p-6 lg:col-span-5`}>
        <p className={sectionLabel}>Trend</p>
        <h3 className={`${sectionTitle} mt-1`}>Net flow by month</h3>
        <div className="mt-4 h-[220px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series.map((m) => ({ ...m, net: m.inflow - m.outflow }))} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="net" name="Net" stroke="#1a56db" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
