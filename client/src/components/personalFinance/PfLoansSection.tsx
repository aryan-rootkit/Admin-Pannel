"use client";

import { formatMoney } from "@/lib/format";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { glassCard, sectionLabel, sectionTitle } from "@/components/dashboard/dashboardStyles";
import type { PfLoanRow } from "@/types/personalFinance";

type Props = {
  loans: PfLoanRow[];
  onAdd: () => void;
  onRepay: (loan: PfLoanRow) => void;
  onEdit: (loan: PfLoanRow) => void;
  onDelete: (id: string) => void;
};

function kindLabel(k: PfLoanRow["loanKind"]) {
  if (k === "borrowed_bank") return "Borrowed (bank)";
  if (k === "borrowed_person") return "Borrowed (person)";
  return "Lent to person";
}

export function PfLoansSection({ loans, onAdd, onRepay, onEdit, onDelete }: Props) {
  const borrowed = loans.filter((l) => l.loanKind !== "lent_to_person");
  const lent = loans.filter((l) => l.loanKind === "lent_to_person");

  return (
    <div className={`${glassCard} p-5 md:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={sectionLabel}>Obligations</p>
          <h3 className={`${sectionTitle} mt-1`}>Loans & borrowings</h3>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Track bank/personal borrowings and money you lent. Partial repayments update outstanding automatically.
          </p>
        </div>
        <Button type="button" className="rounded-full px-5" onClick={onAdd}>
          Add loan / lending
        </Button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">You owe / borrowed</h4>
          <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Party</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2 text-right">Outstanding</th>
                  <th className="px-3 py-2 w-28" />
                </tr>
              </thead>
              <tbody>
                {borrowed.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                      No active borrowings
                    </td>
                  </tr>
                ) : (
                  borrowed.map((l) => (
                    <tr key={l._id} className="border-t border-slate-100">
                      <td className="px-3 py-2.5 font-medium text-slate-900">{l.partyName}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">{kindLabel(l.loanKind)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-rose-800">
                        {formatMoney(l.outstanding ?? 0, "INR")}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap justify-end gap-1">
                          <button type="button" className="text-xs font-semibold text-[#1a56db] hover:underline" onClick={() => onRepay(l)}>
                            Repay
                          </button>
                          <button type="button" className="text-xs font-semibold text-slate-600 hover:underline" onClick={() => onEdit(l)}>
                            Edit
                          </button>
                          <button type="button" className="text-xs font-semibold text-rose-600 hover:underline" onClick={() => onDelete(l._id)}>
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Money you lent (receivable)</h4>
          <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Who</th>
                  <th className="px-3 py-2 text-right">Outstanding</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2 w-28" />
                </tr>
              </thead>
              <tbody>
                {lent.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                      No receivables tracked
                    </td>
                  </tr>
                ) : (
                  lent.map((l) => (
                    <tr key={l._id} className="border-t border-slate-100">
                      <td className="px-3 py-2.5 font-medium text-slate-900">{l.partyName}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-emerald-800">
                        {formatMoney(l.outstanding ?? 0, "INR")}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">{l.dueDate ? formatDate(l.dueDate) : "—"}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap justify-end gap-1">
                          <button type="button" className="text-xs font-semibold text-[#1a56db] hover:underline" onClick={() => onRepay(l)}>
                            Received
                          </button>
                          <button type="button" className="text-xs font-semibold text-slate-600 hover:underline" onClick={() => onEdit(l)}>
                            Edit
                          </button>
                          <button type="button" className="text-xs font-semibold text-rose-600 hover:underline" onClick={() => onDelete(l._id)}>
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
