"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
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
import { computeBurnRunway } from "@/lib/burnRunway";
import { formatMoney } from "@/lib/format";
import {
  readDashboardSessionCache,
  writeDashboardSessionCache,
} from "@/lib/dashboardSessionCache";
import { DashboardKpiStrip } from "@/components/dashboard/DashboardKpiStrip";
import { DashboardSmartSummary } from "@/components/dashboard/DashboardSmartSummary";
import { DashboardAttention } from "@/components/dashboard/DashboardAttention";
import { DashboardRevenueIntel } from "@/components/dashboard/DashboardRevenueIntel";
import { DashboardBurnIntelligence } from "@/components/dashboard/DashboardBurnIntelligence";
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

  useLayoutEffect(() => {
    const cached = readDashboardSessionCache();
    if (!cached) return;
    setProjects(Array.isArray(cached.projects) ? cached.projects : []);
    setPeople(Array.isArray(cached.people) ? cached.people : []);
    setRevenues(Array.isArray(cached.revenues) ? cached.revenues : []);
    setPayouts(Array.isArray(cached.payouts) ? cached.payouts : []);
    setFinance(cached.finance);
    setMonthly(Array.isArray(cached.monthly) ? cached.monthly : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const hadCache = readDashboardSessionCache() != null;

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
        if (cancelled) return;
        const nextProjects = Array.isArray(proj) ? proj : [];
        const nextPeople = Array.isArray(peop) ? peop : [];
        const nextRevenues = Array.isArray(rev) ? rev : [];
        const nextPayouts = Array.isArray(pay) ? pay : [];
        const nextMonthly = Array.isArray(mon) ? mon : [];
        setProjects(nextProjects);
        setPeople(nextPeople);
        setRevenues(nextRevenues);
        setPayouts(nextPayouts);
        setFinance(fin);
        setMonthly(nextMonthly);
        setError(null);
        writeDashboardSessionCache({
          projects: nextProjects,
          people: nextPeople,
          revenues: nextRevenues,
          payouts: nextPayouts,
          finance: fin,
          monthly: nextMonthly,
        });
      } catch (e) {
        if (!cancelled) {
          if (!hadCache) {
            setError(e instanceof Error ? e.message : "Failed to load dashboard");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const burn = useMemo(() => computeBurnRunway(finance, monthly), [finance, monthly]);

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
        burn,
      }),
    [mom, overdue, status, finance, stalled.length, burn]
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

  const showContent = !error && finance;

  return (
    <div className={`min-w-0 pb-8 ${stackSections}`}>
      <header className="flex flex-col gap-4 border-b border-slate-200/90 pb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-purity-text md:text-[1.75rem] md:leading-tight">
          Dashboard
        </h1>
        <DashboardQuickActionChips />
      </header>

      {loading && !finance ? <DashboardSkeleton /> : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {showContent ? (
        <>
          <DashboardKpiStrip
            finance={finance}
            momRevenue={mom.revenue}
            momCost={mom.cost}
            momProfit={mom.profit}
            burn={burn}
          />

          <div className="grid gap-6 lg:gap-8 xl:grid-cols-12 xl:items-start">
            <div className="order-1 flex min-h-0 min-w-0 flex-col gap-6 xl:col-span-3 xl:gap-8">
              <DashboardAttention
                variant="sidebar"
                overdueCount={overdue.count}
                overdueAmount={overdue.amount}
                highPendingLabel={highPendingLabel}
                cancelledProjects={status.cancelled}
                stalled={stalled}
              />
              <DashboardActivity items={activity} />
            </div>

            <div className="order-2 min-w-0 space-y-6 xl:col-span-6 xl:space-y-8">
              <DashboardRevenueIntel
                finance={finance}
                monthly={monthly}
                statusSlices={statusSlices}
                loading={false}
                error={null}
              />
              <DashboardBurnIntelligence burn={burn} />
              <DashboardProjectHealth finance={finance} />
            </div>

            <aside className="order-3 flex min-h-0 min-w-0 flex-col gap-6 xl:sticky xl:top-24 xl:col-span-3 xl:max-h-[calc(100dvh-8rem)] xl:self-start xl:overflow-y-auto xl:overscroll-y-contain">
              <DashboardSmartSummary lines={summaryLines} className="w-full shrink-0" />
              <DashboardTeamInsights
                peopleCount={people.length}
                activeWithProjects={activeWithProjects}
                topPaid={topPaid}
              />
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
