"use client";

import { glassCard } from "@/components/dashboard/dashboardStyles";

export function PersonDetailSkeleton() {
  return (
    <div className="min-w-0 space-y-6 pb-8" aria-busy="true" aria-live="polite">
      <div className="h-9 w-40 animate-pulse rounded-lg bg-slate-200/80" />
      <div className="h-10 max-w-md animate-pulse rounded-lg bg-slate-200/80 sm:w-[66%]" />
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-6 lg:col-span-4">
          <div className={`${glassCard} aspect-square animate-pulse`} />
          <div className={`${glassCard} space-y-3 p-6`}>
            <div className="h-6 w-28 animate-pulse rounded bg-slate-200/80" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-slate-100" />
              ))}
            </div>
          </div>
          <div className={`${glassCard} space-y-3 p-6`}>
            <div className="h-6 w-24 animate-pulse rounded bg-slate-200/80" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-full bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="space-y-6 lg:col-span-8">
          <div className={`${glassCard} space-y-4 p-6 md:p-8`}>
            <div className="h-6 w-24 animate-pulse rounded bg-slate-200/80" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-4 max-w-[85%] animate-pulse rounded bg-slate-100" />
            </div>
          </div>
          <div className={`${glassCard} space-y-4 p-6`}>
            <div className="h-6 w-32 animate-pulse rounded bg-slate-200/80" />
            <div className="flex gap-2">
              <div className="h-9 w-16 animate-pulse rounded-full bg-slate-100" />
              <div className="h-9 w-20 animate-pulse rounded-full bg-slate-100" />
            </div>
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-100 bg-slate-50/80" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
