"use client";

import { formatMoney } from "@/lib/format";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { glassCard, sectionLabel, sectionTitle } from "@/components/dashboard/dashboardStyles";
import type { PfSubscriptionRow } from "@/types/personalFinance";

type Props = {
  rows: PfSubscriptionRow[];
  upcoming: PfSubscriptionRow[];
  overdue: PfSubscriptionRow[];
  monthlyEquiv: number;
  onAdd: () => void;
  onEdit: (s: PfSubscriptionRow) => void;
  onDelete: (id: string) => void;
};

export function PfSubscriptionsSection({ rows, upcoming, overdue, monthlyEquiv, onAdd, onEdit, onDelete }: Props) {
  const now = Date.now();
  const soon = (d?: string | null) => {
    if (!d) return false;
    const t = new Date(d).getTime();
    return t >= now && t <= now + 7 * 86400000;
  };

  return (
    <div className={`${glassCard} p-5 md:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={sectionLabel}>Recurring</p>
          <h3 className={`${sectionTitle} mt-1`}>Subscriptions & recurring</h3>
          <p className="mt-1 text-sm text-slate-500">
            Estimated monthly run-rate:{" "}
            <span className="font-semibold text-slate-800">{formatMoney(monthlyEquiv, "INR")}</span>
          </p>
        </div>
        <Button type="button" className="rounded-full px-5" onClick={onAdd}>
          Add subscription
        </Button>
      </div>

      {(overdue.length > 0 || upcoming.length > 0) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {overdue.length ? (
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 ring-1 ring-rose-100">
              {overdue.length} overdue / due
            </span>
          ) : null}
          {upcoming.length ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-100">
              {upcoming.length} due within 7 days
            </span>
          ) : null}
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Cycle</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2">Next due</th>
              <th className="px-3 py-2">Auto</th>
              <th className="px-3 py-2 w-24" />
            </tr>
          </thead>
          <tbody>
            {rows.filter((r) => r.active).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  No subscriptions — add Netflix, hosting, tools, recharge plans…
                </td>
              </tr>
            ) : (
              rows
                .filter((r) => r.active)
                .map((s) => {
                  const od = s.nextDueDate && new Date(s.nextDueDate).getTime() < now;
                  const su = soon(s.nextDueDate);
                  return (
                    <tr key={s._id} className="border-t border-slate-100">
                      <td className="px-3 py-2.5 font-medium text-slate-900">
                        {s.name}
                        {od ? (
                          <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">OVERDUE</span>
                        ) : su ? (
                          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">DUE SOON</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-xs capitalize text-slate-600">{s.billingCycle}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{formatMoney(s.amount, "INR")}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">{s.nextDueDate ? formatDate(s.nextDueDate) : "—"}</td>
                      <td className="px-3 py-2.5 text-xs">{s.autoRenew ? "Yes" : "No"}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-2">
                          <button type="button" className="text-xs font-semibold text-[#1a56db] hover:underline" onClick={() => onEdit(s)}>
                            Edit
                          </button>
                          <button type="button" className="text-xs font-semibold text-rose-600 hover:underline" onClick={() => onDelete(s._id)}>
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
