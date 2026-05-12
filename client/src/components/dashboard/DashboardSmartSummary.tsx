"use client";

import { glassCard, sectionLabel, sectionTitle, cardPadding } from "@/components/dashboard/dashboardStyles";

type Props = {
  lines: string[];
  className?: string;
};

export function DashboardSmartSummary({ lines, className = "" }: Props) {
  return (
    <aside
      className={`${glassCard} flex min-h-0 flex-col border-blue-200/80 bg-gradient-to-b from-white to-slate-50/95 ${cardPadding} ring-1 ring-blue-100 ${className}`}
      aria-label="Smart summary"
    >
      <div className="flex shrink-0 items-start justify-between gap-2">
        <div>
          <p className={sectionLabel}>Smart summary</p>
          <h3 className={`mt-1 ${sectionTitle}`}>Operational pulse</h3>
        </div>
        <span className="rounded-full bg-purity-accent/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-purity-accent ring-1 ring-purity-accent/25">
          Live
        </span>
      </div>
      <ul className="mt-6 flex min-h-0 flex-1 flex-col divide-y divide-slate-200/90 rounded-xl bg-slate-50/90 p-3 ring-1 ring-slate-200/80">
        {lines.length === 0 ? (
          <li className="py-3 text-sm text-purity-muted">No insights yet — add revenue and projects.</li>
        ) : (
          lines.map((line, i) => (
            <li
              key={i}
              className="py-3 text-sm leading-relaxed text-purity-text/95 first:pt-1 last:pb-1"
            >
              {line}
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
