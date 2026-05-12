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
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { glassCard } from "@/components/dashboard/dashboardStyles";

function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-12">
        <div className={`${glassCard} col-span-2 h-44 animate-pulse lg:col-span-4`} />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`${glassCard} col-span-1 h-44 animate-pulse lg:col-span-2`} />
        ))}
      </div>
      <div className="grid gap-8 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-8">
          <div className={`${glassCard} h-40 animate-pulse`} />
          <div className={`${glassCard} h-72 animate-pulse`} />
          <div className={`${glassCard} h-56 animate-pulse`} />
        </div>
        <div className={`${glassCard} h-96 animate-pulse xl:col-span-4`} />
      </div>
    </div>
  );
}

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
      { name: "Active", value: status.active, fill: "#22d3ee" },
      { name: "Completed", value: status.completed, fill: "#34d399" },
      { name: "Cancelled", value: status.cancelled, fill: "#fb7185" },
    ],
    [status]
  );

  const activeWithProjects = useMemo(
    () =>
      people.filter((p) => Array.isArray(p.assignedProjects) && p.assignedProjects.length > 0).length,
    [people]
  );

  const today = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  return (
    <div className="min-w-0 pb-10">
      <header className="mb-8 flex flex-col gap-1 border-b border-purity-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-purity-text md:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-purity-muted">
            What changed, what needs attention, and where to act next — Rootkit finance &
            delivery in one view.
          </p>
          <p className="mt-2 text-xs font-medium text-purity-muted/90">{today}</p>
        </div>
      </header>

      {loading ? <DashboardSkeleton /> : null}

      {error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {!loading && !error && finance ? (
        <>
          <DashboardKpiStrip finance={finance} momRevenue={mom.revenue} momCost={mom.cost} momProfit={mom.profit} />

          <div className="mt-10 grid gap-8 xl:grid-cols-12 xl:items-start">
            <div className="min-w-0 space-y-10 xl:col-span-8">
              <DashboardAttention
                overdueCount={overdue.count}
                overdueAmount={overdue.amount}
                highPendingLabel={highPendingLabel}
                cancelledProjects={status.cancelled}
                stalled={stalled}
              />
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
              <DashboardQuickActions />
            </div>

            <div className="xl:col-span-4 xl:sticky xl:top-24">
              <DashboardSmartSummary lines={summaryLines} />
            </div>
          </div>
        </>
      ) : null}

      {!loading && !error && !finance ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
          Finance analytics unavailable.
        </div>
      ) : null}
    </div>
  );
}
