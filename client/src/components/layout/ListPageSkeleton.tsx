"use client";

import { glassCard } from "@/components/dashboard/dashboardStyles";

type Props = {
  rows?: number;
};

/**
 * List/table loading placeholder — matches PageToolbar + list panel rhythm.
 */
const rowSk = "bg-slate-200/70 rk-skeleton-shimmer rounded-md";

export function ListPageSkeleton({ rows = 8 }: Props) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className={`h-8 w-40 sm:h-9 sm:w-48 ${rowSk}`} />
        <div className={`h-10 w-full sm:w-28 ${rowSk} rounded-xl`} />
      </div>
      <div className={`${glassCard} overflow-hidden`}>
        <div className="flex gap-4 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
          <div className={`h-3 w-[22%] ${rowSk}`} />
          <div className={`h-3 w-[18%] ${rowSk}`} />
          <div className={`h-3 w-[14%] ${rowSk}`} />
          <div className={`ml-auto h-3 w-14 ${rowSk}`} />
        </div>
        <ul className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, i) => (
            <li key={i} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:flex-nowrap">
              <div className={`h-4 min-w-0 flex-1 basis-[40%] max-w-[14rem] ${rowSk}`} />
              <div className={`h-4 w-32 shrink-0 max-sm:w-24 ${rowSk}`} />
              <div className={`h-4 w-24 shrink-0 max-sm:hidden ${rowSk}`} />
              <div className="ml-auto flex shrink-0 gap-2 max-sm:w-full max-sm:justify-end">
                <div className={`h-4 w-10 ${rowSk}`} />
                <div className={`h-4 w-12 ${rowSk}`} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
