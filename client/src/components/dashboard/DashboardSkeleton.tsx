"use client";

import { glassCard, kpiCard } from "@/components/dashboard/dashboardStyles";

const sk = "bg-slate-200/70 rk-skeleton-shimmer rounded-lg";

/**
 * Mirrors loaded dashboard: header + 6 KPIs + main (9) + rail (3): revenue stack,
 * then summary → attention → activity → team — single page scroll (no rail overflow).
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 lg:space-y-8" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-4 border-b border-slate-200/90 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className={`h-9 w-44 ${sk} sm:h-10 sm:w-52`} />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-8 w-[5.5rem] rounded-lg border border-slate-100 ${sk} sm:w-24`} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${kpiCard} min-h-[10.5rem]`}>
            <div className={`h-2.5 w-16 ${sk}`} />
            <div className={`mt-3 h-12 w-full max-w-[11rem] mx-auto rounded-[14px] ${sk}`} />
            <div className={`mt-2 h-2.5 w-24 ${sk}`} />
            <div className={`mt-auto pt-2 h-6 w-full ${sk}`} />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:gap-8 xl:grid-cols-12 xl:items-start">
        <div className="order-1 min-w-0 space-y-6 xl:col-span-9 xl:space-y-8">
          <div className={`${glassCard} space-y-4 p-5 md:p-6`}>
            <div className={`h-3 w-40 ${sk}`} />
            <div className="grid min-h-0 gap-4 lg:grid-cols-5 lg:items-stretch">
              <div className={`min-h-[280px] rounded-xl lg:col-span-3 ${sk}`} />
              <div className={`min-h-[240px] rounded-xl lg:col-span-2 ${sk}`} />
            </div>
            <div className={`h-[180px] w-full rounded-xl ${sk}`} />
            <div className={`h-32 w-full rounded-xl ${sk}`} />
          </div>

          <div className="space-y-3">
            <div>
              <div className={`h-3 w-52 ${sk}`} />
              <div className={`mt-2 h-2.5 max-w-md ${sk}`} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`${glassCard} min-h-[7.5rem] p-4`}>
                  <div className={`h-2.5 w-20 ${sk}`} />
                  <div className={`mt-3 h-6 w-24 ${sk}`} />
                  <div className={`mt-2 h-2 w-16 ${sk}`} />
                  <div className={`mt-2 h-6 w-full ${sk}`} />
                </div>
              ))}
            </div>
          </div>

          <div className={`${glassCard} h-36 p-4 md:p-5`}>
            <div className={`h-3 w-36 ${sk}`} />
            <div className={`mt-4 h-16 w-full ${sk}`} />
          </div>
        </div>

        <aside className="order-2 flex min-w-0 flex-col gap-6 xl:col-span-3">
          <div className={`${glassCard} min-h-[14rem] p-5`}>
            <div className={`h-3 w-32 ${sk}`} />
            <div className="mt-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-3 w-full ${sk}`} />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className={`h-3 w-40 ${sk}`} />
            {[1, 2].map((i) => (
              <div key={i} className={`${glassCard} min-h-[6rem] space-y-2 p-4`}>
                <div className={`h-2.5 w-full max-w-[10rem] ${sk}`} />
                <div className={`h-2.5 w-2/3 ${sk}`} />
              </div>
            ))}
          </div>
          <div className={`${glassCard} p-4`}>
            <div className={`h-3 w-24 ${sk}`} />
            <div className="mt-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className={`h-8 w-8 shrink-0 rounded-lg ${sk}`} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className={`h-2.5 w-full max-w-[10rem] ${sk}`} />
                    <div className={`h-2 w-16 ${sk}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={`${glassCard} min-h-[14rem] p-5`}>
            <div className={`h-3 w-28 ${sk}`} />
            <div className="mt-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`h-3 w-full ${sk}`} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
