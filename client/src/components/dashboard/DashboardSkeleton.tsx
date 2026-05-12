"use client";

import { glassCard } from "@/components/dashboard/dashboardStyles";

/**
 * Mirrors loaded dashboard layout: header chips + KPI row + main (revenue) + right rail (attention + summary) + lower blocks.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 lg:space-y-8" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-4 border-b border-slate-200/90 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-9 w-44 animate-pulse rounded-lg bg-slate-200/80 sm:h-10 sm:w-52" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-[5.5rem] animate-pulse rounded-lg border border-slate-100 bg-slate-100/90 sm:w-24" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className={`${glassCard} col-span-2 h-[11.5rem] animate-pulse lg:col-span-4`} />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`${glassCard} col-span-1 h-[11.5rem] animate-pulse lg:col-span-2`} />
        ))}
      </div>

      <div className="grid gap-6 lg:gap-8 xl:grid-cols-12 xl:items-start">
        <div className="min-w-0 space-y-6 lg:space-y-8 xl:col-span-8">
          <div className={`${glassCard} space-y-4 p-5 md:p-6`}>
            <div className="h-3 w-36 animate-pulse rounded bg-slate-200/80" />
            <div className="h-4 w-56 animate-pulse rounded bg-slate-200/80" />
            <div className="h-[220px] w-full animate-pulse rounded-xl bg-slate-100" />
            <div className="grid gap-4 sm:grid-cols-5">
              <div className="h-[200px] animate-pulse rounded-xl bg-slate-100 sm:col-span-3" />
              <div className="h-[200px] animate-pulse rounded-xl bg-slate-100 sm:col-span-2" />
            </div>
            <div className="h-40 w-full animate-pulse rounded-xl bg-slate-100" />
            <div className="h-32 w-full animate-pulse rounded-xl bg-slate-100" />
          </div>
          <div className={`${glassCard} h-48 animate-pulse`} />
          <div className={`${glassCard} h-56 animate-pulse`} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={`${glassCard} h-40 animate-pulse`} />
            <div className={`${glassCard} h-40 animate-pulse`} />
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-6 xl:col-span-4">
          <div className="space-y-3">
            <div className="h-3 w-40 animate-pulse rounded bg-slate-200/80" />
            {[1, 2, 3].map((i) => (
              <div key={i} className={`${glassCard} h-28 animate-pulse`} />
            ))}
          </div>
          <div className={`${glassCard} min-h-[14rem] flex-1 animate-pulse`} />
        </aside>
      </div>
    </div>
  );
}
