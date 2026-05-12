"use client";

import { glassCard, cardPadding } from "@/components/dashboard/dashboardStyles";

function ShimmerBar({ className }: { className: string }) {
  return <div className={`skeleton-cell ${className}`} />;
}

/**
 * Mirrors loaded dashboard: header + KPI row + 12-col operational (4) / finance (5) / insights (3).
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 lg:space-y-8" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-4 border-b border-slate-200/90 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <ShimmerBar className="h-9 w-44 sm:h-10 sm:w-52" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <ShimmerBar key={i} className="h-8 w-[5.5rem] rounded-lg sm:w-24" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-12 lg:gap-5">
        <div
          className={`${glassCard} relative col-span-2 flex min-h-[10.5rem] flex-col justify-between overflow-hidden ${cardPadding} ring-1 ring-slate-200/50 lg:col-span-4`}
        >
          <ShimmerBar className="h-2.5 w-20" />
          <div className="mx-auto mt-3 w-full max-w-[14rem]">
            <ShimmerBar className="h-14 w-full rounded-xl" />
          </div>
          <ShimmerBar className="mt-3 h-2.5 w-32" />
          <ShimmerBar className="mt-2 h-2 w-full max-w-[12rem]" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`${glassCard} col-span-1 flex min-h-[10.5rem] flex-col justify-between ${cardPadding} ring-1 ring-slate-200/50 lg:col-span-2`}
          >
            <ShimmerBar className="h-2.5 w-16" />
            <div className="mt-3">
              <ShimmerBar className="mx-auto h-12 w-full max-w-[9rem] rounded-xl" />
            </div>
            <ShimmerBar className="mt-3 h-2.5 w-24" />
            <ShimmerBar className="mt-2 h-2 w-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:gap-8 xl:grid-cols-12 xl:items-start">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-4">
          <div>
            <ShimmerBar className="mb-3 h-2.5 w-36" />
            <div className="grid grid-cols-1 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`${glassCard} min-h-[6.5rem] ${cardPadding} ring-1 ring-slate-200/50`}>
                  <ShimmerBar className="h-2 w-28" />
                  <ShimmerBar className="mt-3 h-3 w-full max-w-[12rem]" />
                  <ShimmerBar className="mt-2 h-2 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <ShimmerBar className="mb-3 h-2.5 w-24" />
            <div className={`${glassCard} min-h-[14rem] p-2 ring-1 ring-slate-200/50 sm:p-3`}>
              <ul className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i} className="flex gap-3 rounded-xl px-2 py-2">
                    <ShimmerBar className="h-8 w-10 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <ShimmerBar className="h-2.5 w-full" />
                      <ShimmerBar className="h-2 w-[70%] max-w-[14rem]" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-6 lg:space-y-8 xl:col-span-5">
          <div className={`${glassCard} space-y-4 ${cardPadding} ring-1 ring-slate-200/50`}>
            <ShimmerBar className="h-2.5 w-36" />
            <ShimmerBar className="h-3 w-48" />
            <ShimmerBar className="h-[200px] w-full rounded-xl" />
            <div className="grid gap-4 sm:grid-cols-5">
              <ShimmerBar className="h-[180px] rounded-xl sm:col-span-3" />
              <ShimmerBar className="h-[180px] rounded-xl sm:col-span-2" />
            </div>
            <ShimmerBar className="h-28 w-full rounded-xl" />
          </div>

          <div
            className={`${glassCard} min-h-[12rem] border-l-[4px] border-l-indigo-400/80 ${cardPadding} ring-1 ring-indigo-100/60`}
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div className="space-y-2">
                <ShimmerBar className="h-2 w-28" />
                <ShimmerBar className="h-4 w-48" />
                <ShimmerBar className="h-2 w-full max-w-md" />
              </div>
              <ShimmerBar className="h-6 w-20 rounded-full" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 ring-1 ring-slate-100/80">
                  <ShimmerBar className="h-2 w-20" />
                  <ShimmerBar className="mt-3 h-6 w-24" />
                  <ShimmerBar className="mt-3 h-2 w-full" />
                </div>
              ))}
            </div>
          </div>

          <div className={`${glassCard} min-h-[11rem] ${cardPadding} ring-1 ring-slate-200/50`}>
            <ShimmerBar className="h-2.5 w-40" />
            <ShimmerBar className="mt-3 h-3 w-56" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ShimmerBar className="h-24 rounded-xl" />
              <ShimmerBar className="h-24 rounded-xl" />
            </div>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-6 xl:col-span-3">
          <div className={`${glassCard} min-h-[14rem] ${cardPadding} ring-1 ring-slate-200/50`}>
            <ShimmerBar className="h-2.5 w-32" />
            <div className="mt-4 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-2">
                  <ShimmerBar className="mt-1 h-2 w-2 shrink-0 rounded-full" />
                  <ShimmerBar className="h-3 min-h-[2.5rem] flex-1" />
                </div>
              ))}
            </div>
          </div>
          <div className={`${glassCard} min-h-[12rem] ${cardPadding} ring-1 ring-slate-200/50`}>
            <ShimmerBar className="h-2.5 w-28" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <ShimmerBar className="h-24 rounded-xl" />
              <ShimmerBar className="h-24 rounded-xl" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
