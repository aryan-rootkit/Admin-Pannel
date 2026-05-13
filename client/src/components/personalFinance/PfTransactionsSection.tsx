"use client";

import { formatMoney } from "@/lib/format";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { glassCard, sectionLabel, sectionTitle } from "@/components/dashboard/dashboardStyles";
import type { PfTransactionRow } from "@/types/personalFinance";
import { PF_EXPENSE_CATEGORIES } from "@/types/personalFinance";

type Props = {
  rows: PfTransactionRow[];
  flowFilter: string;
  categoryFilter: string;
  search: string;
  onFlowChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onAddManual: () => void;
  onDelete: (id: string) => void;
};

export function PfTransactionsSection({
  rows,
  flowFilter,
  categoryFilter,
  search,
  onFlowChange,
  onCategoryChange,
  onSearchChange,
  onAddManual,
  onDelete,
}: Props) {
  return (
    <div className={`${glassCard} p-5 md:p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={sectionLabel}>Ledger</p>
          <h3 className={`${sectionTitle} mt-1`}>Expense & income tracking</h3>
          <p className="mt-1 text-sm text-slate-500">Manual entries and approved imports. Use filters as your data grows.</p>
        </div>
        <Button type="button" className="rounded-full px-5" onClick={onAddManual}>
          Quick entry
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="text-xs font-semibold text-slate-600">Flow</label>
          <Select className="mt-1" value={flowFilter} onChange={(e) => onFlowChange(e.target.value)}>
            <option value="">All</option>
            <option value="in">In</option>
            <option value="out">Out</option>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Category</label>
          <Select className="mt-1" value={categoryFilter} onChange={(e) => onCategoryChange(e.target.value)}>
            <option value="">All</option>
            {PF_EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-slate-600">Search</label>
          <Input className="mt-1" value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Title, notes, category…" />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 w-16" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                  No transactions match filters.
                </td>
              </tr>
            ) : (
              rows.map((t) => (
                <tr key={t._id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-xs text-slate-600">{formatDate(t.occurredAt)}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">{t.title || "—"}</td>
                  <td className="px-3 py-2 text-xs capitalize text-slate-600">{t.category}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{t.source || "manual"}</td>
                  <td
                    className={`px-3 py-2 text-right text-sm font-semibold tabular-nums ${
                      t.flow === "in" ? "text-emerald-800" : "text-rose-800"
                    }`}
                  >
                    {t.flow === "in" ? "+" : "−"}
                    {formatMoney(t.amount, "INR")}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-xs font-semibold text-rose-600 hover:underline"
                      onClick={() => onDelete(t._id)}
                    >
                      Del
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
