"use client";

import { glassCard, sectionLabel } from "@/components/dashboard/dashboardStyles";

type Props = {
  lines: string[];
};

export function DashboardSmartSummary({ lines }: Props) {
  return (
    <aside
      className={`${glassCard} flex min-h-[240px] flex-col border-purity-accent/25 bg-gradient-to-b from-purity-card to-neutral-950/40 p-5 ring-1 ring-purity-accent/20`}
      aria-label="Smart summary"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={sectionLabel}>Smart summary</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-purity-text">
            Operational pulse
          </h3>
        </div>
        <span className="rounded-full bg-purity-accent/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-purity-accent">
          Live
        </span>
      </div>
      <ul className="mt-5 flex flex-1 flex-col gap-0 divide-y divide-white/10 rounded-xl bg-neutral-950/50 p-3 ring-1 ring-white/5">
        {lines.length === 0 ? (
          <li className="py-3 text-sm text-purity-muted">No insights yet — add revenue and projects.</li>
        ) : (
          lines.map((line, i) => (
            <li key={i} className="py-2.5 text-sm leading-snug text-purity-text/95 first:pt-0 last:pb-0">
              {line}
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
