"use client";

import { formatMoney } from "@/lib/format";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { glassCard, sectionLabel, sectionTitle, valueHero } from "@/components/dashboard/dashboardStyles";
import type { PfLoanRow, PfPersonalPosition, PfRootkitBusiness } from "@/types/personalFinance";

type Props = {
  loans: PfLoanRow[];
  rootkitBusiness?: PfRootkitBusiness | null;
  personalPosition?: PfPersonalPosition | null;
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

function isActiveLoan(l: PfLoanRow) {
  return l.status !== "settled" && (l.outstanding ?? 0) > 0.01;
}

export function PfLoansSection({
  loans,
  rootkitBusiness,
  personalPosition,
  onAdd,
  onRepay,
  onEdit,
  onDelete,
}: Props) {
  const borrowed = loans.filter((l) => l.loanKind !== "lent_to_person" && isActiveLoan(l));
  const lent = loans.filter((l) => l.loanKind === "lent_to_person" && isActiveLoan(l));
  const settledCount = loans.filter((l) => !isActiveLoan(l)).length;

  return (
    <div className={`${glassCard} p-5 md:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={sectionLabel}>Obligations</p>
          <h3 className={`${sectionTitle} mt-1`}>Loans & borrowings</h3>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Rootkit profit is your money in. Use <strong className="font-semibold text-slate-700">Repay</strong> to
            record payments — outstanding updates automatically and posts to your cash ledger.
          </p>
        </div>
        <Button type="button" className="rounded-full px-5" onClick={onAdd}>
          Add loan / lending
        </Button>
      </div>

      {rootkitBusiness || personalPosition ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className={`${valueHero} border border-emerald-200/60 bg-emerald-50/50 px-4 py-3`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">Rootkit profit (money in)</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-900">
              {formatMoney(rootkitBusiness?.rootkitNet ?? personalPosition?.moneyIn ?? 0, "INR")}
            </p>
            <p className="mt-1 text-[10px] text-slate-600">Left with Rootkit after project & company costs</p>
          </div>
          <div className={`${valueHero} border border-rose-200/60 bg-rose-50/50 px-4 py-3`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-rose-800">You still owe (money out)</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-rose-900">
              {formatMoney(personalPosition?.moneyOut ?? 0, "INR")}
            </p>
            <p className="mt-1 text-[10px] text-slate-600">{borrowed.length} active borrowing lines</p>
          </div>
          <div className={`${valueHero} px-4 py-3`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">Month surplus</p>
            <p
              className={`mt-1 text-lg font-bold tabular-nums ${
                (personalPosition?.monthSurplus ?? 0) >= 0 ? "text-emerald-900" : "text-rose-900"
              }`}
            >
              {formatMoney(personalPosition?.monthSurplus ?? rootkitBusiness?.estimatedSavings ?? 0, "INR")}
            </p>
            <p className="mt-1 text-[10px] text-slate-600">Rootkit net − personal spend</p>
          </div>
        </div>
      ) : null}

      {settledCount > 0 ? (
        <p className="mt-4 text-xs text-slate-500">
          {settledCount} settled loan(s) hidden — fully repaid or received back.
        </p>
      ) : null}

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">You owe / borrowed</h4>
          <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Party</th>
                  <th className="px-3 py-2 text-right">Principal</th>
                  <th className="px-3 py-2 text-right">Repaid</th>
                  <th className="px-3 py-2 text-right">Outstanding</th>
                  <th className="px-3 py-2 w-32" />
                </tr>
              </thead>
              <tbody>
                {borrowed.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                      No active borrowings
                    </td>
                  </tr>
                ) : (
                  borrowed.map((l) => (
                    <tr key={l._id} className="border-t border-slate-100">
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-slate-900">{l.partyName}</div>
                        <div className="text-[10px] text-slate-500">{kindLabel(l.loanKind)}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                        {formatMoney(l.principal, "INR")}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700">
                        {formatMoney(l.repaid ?? 0, "INR")}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-rose-800">
                        {formatMoney(l.outstanding ?? 0, "INR")}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col items-end gap-1 sm:flex-row sm:flex-wrap sm:justify-end">
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-8 min-h-0 px-2.5 py-1 text-xs"
                            onClick={() => onRepay(l)}
                          >
                            Repay
                          </Button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-slate-600 hover:underline"
                            onClick={() => onEdit(l)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-rose-600 hover:underline"
                            onClick={() => onDelete(l._id)}
                          >
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
            <table className="w-full min-w-[380px] text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Who</th>
                  <th className="px-3 py-2 text-right">Outstanding</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2 w-32" />
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
                      <td className="px-3 py-2.5 text-xs text-slate-600">
                        {l.dueDate ? formatDate(l.dueDate) : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col items-end gap-1 sm:flex-row sm:flex-wrap sm:justify-end">
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-8 min-h-0 px-2.5 py-1 text-xs"
                            onClick={() => onRepay(l)}
                          >
                            Received
                          </Button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-slate-600 hover:underline"
                            onClick={() => onEdit(l)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-xs font-semibold text-rose-600 hover:underline"
                            onClick={() => onDelete(l._id)}
                          >
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
