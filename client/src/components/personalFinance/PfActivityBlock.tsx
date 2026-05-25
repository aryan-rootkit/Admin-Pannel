"use client";

import { formatMoney } from "@/lib/format";
import { glassCard, sectionLabel, sectionTitle } from "@/components/dashboard/dashboardStyles";
import type { PfActivityItem } from "@/types/personalFinance";
import { formatDate } from "@/lib/format";

type Props = {
  items: PfActivityItem[];
};

export function PfActivityBlock({ items }: Props) {
  return (
    <div className={`${glassCard} p-5 md:p-6`}>
      <p className={sectionLabel}>Activity</p>
      <h3 className={`${sectionTitle} mt-1`}>Recent finance events</h3>
      <ul className="mt-4 max-h-[420px] space-y-0 overflow-y-auto">
        {items.length === 0 ? (
          <li className="py-6 text-center text-sm text-slate-500">No activity yet — add a transaction or import.</li>
        ) : (
          items.map((a) => (
            <li key={a.id} className="flex gap-3 border-b border-slate-100 py-3 last:border-0">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#1a56db]" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                <p className="text-xs text-slate-500">{a.detail}</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  {formatDate(a.at)} · {a.kind.replace(/_/g, " ")}
                  {a.source === "app" ? " · from app data" : ""}
                </p>
              </div>
              {a.amount != null && a.flow ? (
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    a.flow === "in" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {a.flow === "in" ? "+" : "−"}
                  {formatMoney(a.amount, "INR")}
                </span>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
