"use client";

import { glassCard } from "@/components/dashboard/dashboardStyles";

/**
 * Loading state for Peoples grid — matches card grid (1 / 2 / 3 / 5 cols).
 */
export function PeoplesGridSkeleton({ cards = 10 }: { cards?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className={`${glassCard} flex flex-col overflow-hidden`}
        >
          <div className="aspect-[4/3] animate-pulse bg-slate-100" />
          <div className="space-y-2 px-5 py-4">
        <div className="h-5 w-[80%] max-w-[12rem] animate-pulse rounded bg-slate-200/80" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200/80" />
          </div>
          <div className="mt-auto space-y-3 rounded-t-[16px] bg-slate-200/50 px-5 py-4">
            <div className="flex justify-between gap-2">
              <div className="h-3 w-16 animate-pulse rounded bg-slate-300/80" />
              <div className="h-3 w-14 animate-pulse rounded bg-slate-300/80" />
            </div>
            <div className="flex justify-between gap-2">
              <div className="h-3 w-14 animate-pulse rounded bg-slate-300/80" />
              <div className="h-3 w-10 animate-pulse rounded bg-slate-300/80" />
            </div>
            <div className="flex gap-2 pt-2">
              <div className="h-10 flex-1 animate-pulse rounded-full bg-slate-300/70" />
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-300/70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
