"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { DASHBOARD_SWR_KEY, fetchDashboardBundle } from "@/lib/fetchDashboardBundle";
import { buildDashboardModel } from "@/lib/dashboardModel";
import { DashboardKpiStrip } from "@/components/dashboard/DashboardKpiStrip";
import { DashboardSmartSummary } from "@/components/dashboard/DashboardSmartSummary";
import { DashboardAttention } from "@/components/dashboard/DashboardAttention";
import { DashboardRevenueIntel } from "@/components/dashboard/DashboardRevenueIntel";
import { DashboardProjectHealth } from "@/components/dashboard/DashboardProjectHealth";
import { DashboardActivity } from "@/components/dashboard/DashboardActivity";
import { DashboardTeamInsights } from "@/components/dashboard/DashboardTeamInsights";
import { DashboardQuickActionChips } from "@/components/dashboard/DashboardQuickActions";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DashboardBurnRunway } from "@/components/dashboard/DashboardBurnRunway";
import { stackSections } from "@/components/dashboard/dashboardStyles";

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR(DASHBOARD_SWR_KEY, fetchDashboardBundle, {
    revalidateOnFocus: false,
    dedupingInterval: 120_000,
    errorRetryCount: 2,
  });

  const model = useMemo(() => buildDashboardModel(data), [data]);

  const loadError = error instanceof Error ? error.message : error ? "Failed to load dashboard" : null;
  const showSkeleton = isLoading && !data;

  return (
    <div className={`min-w-0 pb-8 ${stackSections}`}>
      <header className="flex flex-col gap-4 border-b border-slate-200/90 pb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-purity-text md:text-[1.75rem] md:leading-tight">
          Dashboard
        </h1>
        <DashboardQuickActionChips />
      </header>

      {showSkeleton ? <DashboardSkeleton /> : null}

      {loadError && !data ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {loadError}
        </div>
      ) : null}

      {!showSkeleton && data && model.finance ? (
        <>
          <DashboardKpiStrip
            finance={model.finance}
            momRevenue={model.mom.revenue}
            momCost={model.mom.cost}
            momProfit={model.mom.profit}
          />

          <div className="grid gap-6 lg:gap-8 xl:grid-cols-12 xl:items-start">
            <div className="flex min-w-0 flex-col gap-6 lg:gap-8 xl:col-span-4">
              <DashboardAttention
                variant="sidebar"
                overdueCount={model.overdue.count}
                overdueAmount={model.overdue.amount}
                highPendingLabel={model.highPendingLabel}
                cancelledProjects={model.status.cancelled}
                stalled={model.stalled}
              />
              <DashboardActivity items={model.activity} variant="column" />
            </div>

            <div className="min-w-0 space-y-6 lg:space-y-8 xl:col-span-5">
              <DashboardRevenueIntel
                finance={model.finance}
                monthly={model.monthly}
                statusSlices={model.statusSlices}
                loading={false}
                error={null}
              />
              <DashboardBurnRunway intel={model.burnIntel} />
              <DashboardProjectHealth finance={model.finance} />
            </div>

            <aside className="flex min-w-0 flex-col gap-6 lg:gap-8 xl:sticky xl:top-22 xl:col-span-3 xl:self-start">
              <DashboardSmartSummary lines={model.summaryLines} className="w-full" />
              <DashboardTeamInsights
                peopleCount={model.people.length}
                activeWithProjects={model.activeWithProjects}
                topPaid={model.topPaid}
              />
            </aside>
          </div>
        </>
      ) : null}

      {!showSkeleton && data && !model.finance ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Finance analytics unavailable.
        </div>
      ) : null}
    </div>
  );
}
