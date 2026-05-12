"use client";

import { useEffect, useMemo, useState } from "react";
import {
  API_ANALYTICS_FINANCE,
  API_ANALYTICS_MONTHLY,
  API_PEOPLE,
  fetchJson,
  getApiBase,
} from "@/lib/fetchApi";
import type {
  FinanceAnalytics,
  MonthlyAnalyticsRow,
  PayoutRow,
  PersonRow,
  Project,
  RevenueRow,
} from "@/types/api";
import {
  buildActivityFeed,
  highPendingProjects,
  monthlyMomTriple,
  overduePendingRevenues,
  projectStatusCounts,
  smartSummaryLines,
  stalledActiveProjects,
  topPeopleByPayout,
} from "@/lib/dashboardIntelligence";
import { formatMoney } from "@/lib/format";
import { DashboardKpiStrip } from "@/components/dashboard/DashboardKpiStrip";
import { DashboardSmartSummary } from "@/components/dashboard/DashboardSmartSummary";
import { DashboardAttention } from "@/components/dashboard/DashboardAttention";
import { DashboardRevenueIntel } from "@/components/dashboard/DashboardRevenueIntel";
import { DashboardProjectHealth } from "@/components/dashboard/DashboardProjectHealth";
import { DashboardActivity } from "@/components/dashboard/DashboardActivity";
import { DashboardTeamInsights } from "@/components/dashboard/DashboardTeamInsights";
import { DashboardQuickActionChips } from "@/components/dashboard/DashboardQuickActions";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { stackSections } from "@/components/dashboard/dashboardStyles";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [revenues, setRevenues] = useState<RevenueRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [finance, setFinance] = useState<FinanceAnalytics | null>(null);
  const [monthly, setMonthly] = useState<MonthlyAnalyticsRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        getApiBase();
        const [proj, peop, rev, pay, fin, mon] = await Promise.all([
          fetchJson<Project[]>("/projects"),
          fetchJson<PersonRow[]>(API_PEOPLE),
          fetchJson<RevenueRow[]>("/revenues"),
          fetchJson<PayoutRow[]>("/payouts"),
          fetchJson<FinanceAnalytics>(API_ANALYTICS_FINANCE),
          fetchJson<MonthlyAnalyticsRow[]>(API_ANALYTICS_MONTHLY),
        ]);
        if (!cancelled) {
          setProjects(Array.isArray(proj) ? proj : []);
          setPeople(Array.isArray(peop) ? peop : []);
          setRevenues(Array.isArray(rev) ? rev : []);
          setPayouts(Array.isArray(pay) ? pay : []);
          setFinance(fin);
          setMonthly(Array.isArray(mon) ? mon : []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mom = useMemo(() => monthlyMomTriple(monthly), [monthly]);
  const overdue = useMemo(() => overduePendingRevenues(revenues), [revenues]);
  const status = useMemo(() => projectStatusCounts(projects), [projects]);
  const stalled = useMemo(() => stalledActiveProjects(projects), [projects]);
  const activity = useMemo(
    () => buildActivityFeed({ revenues, payouts, projects, limit: 14 }),
    [revenues, payouts, projects]
  );
  const topPaid = useMemo(() => topPeopleByPayout(payouts, people, 4), [payouts, people]);

  const summaryLines = useMemo(
    () =>
      smartSummaryLines({
        mom,
        overdue,
        status,
        finance,
        stalledCount: stalled.length,
      }),
    [mom, overdue, status, finance, stalled.length]
  );

  const highPendingLabel = useMemo(() => {
    const top = highPendingProjects(finance, 1)[0];
    if (!top) return "No outsized pending buckets";
    return `${top.projectName} · ${formatMoney(top.pending, "INR")}`;
  }, [finance]);

  const statusSlices = useMemo(
    () => [
      { name: "Active", value: status.active, fill: "#2563eb" },
      { name: "Completed", value: status.completed, fill: "#16a34a" },
      { name: "Cancelled", value: status.cancelled, fill: "#e11d48" },
    ],
    [status]
  );

  const activeWithProjects = useMemo(
    () =>
      people.filter((p) => Array.isArray(p.assignedProjects) && p.assignedProjects.length > 0).length,
    [people]
  );

  return (
    <div className={`min-w-0 pb-8 ${stackSections}`}>
      <header className="flex flex-col gap-4 border-b border-slate-200/90 pb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-purity-text md:text-[1.75rem] md:leading-tight">
          Dashboard
        </h1>
        <DashboardQuickActionChips />
      </header>

      {loading ? <DashboardSkeleton /> : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {!loading && !error && finance ? (
        <>
          <DashboardKpiStrip finance={finance} momRevenue={mom.revenue} momCost={mom.cost} momProfit={mom.profit} />

          <div className="grid gap-6 lg:gap-8 xl:grid-cols-12 xl:items-start">
            <div className="min-w-0 space-y-6 lg:space-y-8 xl:col-span-8">
              <DashboardRevenueIntel
                finance={finance}
                monthly={monthly}
                statusSlices={statusSlices}
                loading={false}
                error={null}
              />
              <DashboardProjectHealth finance={finance} />
              <DashboardActivity items={activity} />
              <DashboardTeamInsights
                peopleCount={people.length}
                activeWithProjects={activeWithProjects}
                topPaid={topPaid}
              />
            </div>

            <aside className="flex min-h-0 flex-col gap-6 xl:sticky xl:top-[5.5rem] xl:col-span-4 xl:max-h-[calc(100dvh-7rem)] xl:self-start xl:overflow-y-auto xl:overscroll-y-contain">
              <DashboardAttention
                variant="sidebar"
                overdueCount={overdue.count}
                overdueAmount={overdue.amount}
                highPendingLabel={highPendingLabel}
                cancelledProjects={status.cancelled}
                stalled={stalled}
              />
              <DashboardSmartSummary lines={summaryLines} className="w-full" />
            </aside>
          </div>
        </>
      ) : null}

      {!loading && !error && !finance ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Finance analytics unavailable.
        </div>
      ) : null}
    </div>
  );
}
