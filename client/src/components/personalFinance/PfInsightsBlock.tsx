"use client";

import { glassCard, sectionLabel, sectionTitle } from "@/components/dashboard/dashboardStyles";

type Props = {
  lines: { id: string; text: string }[];
};

export function PfInsightsBlock({ lines }: Props) {
  if (!lines.length) return null;
  return (
    <div className={`${glassCard} p-5 md:p-6`}>
      <p className={sectionLabel}>Intelligence</p>
      <h3 className={`${sectionTitle} mt-1`}>Operational signals</h3>
      <ul className="mt-4 space-y-3">
        {lines.map((l) => (
          <li
            key={l.id}
            className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm leading-snug text-slate-800"
          >
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-xs font-bold text-[#1a56db]">
              i
            </span>
            <span>{l.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
