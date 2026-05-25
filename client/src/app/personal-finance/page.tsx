"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_PERSONAL_FINANCE, fetchJson, getApiBase } from "@/lib/fetchApi";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  PfActivityItem,
  PfLoanRow,
  PfStatementImportRow,
  PfStatementLineRow,
  PfLoanRepaymentRow,
  PfSubscriptionRow,
  PfSummaryResponse,
  PfTransactionRow,
} from "@/types/personalFinance";
import { PAGE_TITLE_CLASS } from "@/components/layout/PageHeader";
import { stackSections } from "@/components/dashboard/dashboardStyles";
import { PfKpiSection } from "@/components/personalFinance/PfKpiSection";
import { PfRootkitMoneySection } from "@/components/personalFinance/PfRootkitMoneySection";
import { PfLinkedFlowsSection } from "@/components/personalFinance/PfLinkedFlowsSection";
import { PfPositionKpi } from "@/components/personalFinance/PfPositionKpi";
import { PfCashflowCharts } from "@/components/personalFinance/PfCashflowCharts";
import { PfInsightsBlock } from "@/components/personalFinance/PfInsightsBlock";
import { PfLoansSection } from "@/components/personalFinance/PfLoansSection";
import { PfSubscriptionsSection } from "@/components/personalFinance/PfSubscriptionsSection";
import { PfImportSection } from "@/components/personalFinance/PfImportSection";
import { PfTransactionsSection } from "@/components/personalFinance/PfTransactionsSection";
import { PfActivityBlock } from "@/components/personalFinance/PfActivityBlock";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";
import { useToast } from "@/components/providers/ToastProvider";
import { formatMoney } from "@/lib/format";

function utcMonthRange(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return { from: "", to: "" };
  const from = new Date(Date.UTC(y, m - 1, 1)).toISOString();
  const to = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)).toISOString();
  return { from, to };
}

export default function PersonalFinancePage() {
  const toast = useToast();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [summary, setSummary] = useState<PfSummaryResponse | null>(null);
  const [activity, setActivity] = useState<PfActivityItem[]>([]);
  const [transactions, setTransactions] = useState<PfTransactionRow[]>([]);
  const [loans, setLoans] = useState<PfLoanRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<PfSubscriptionRow[]>([]);
  const [imports, setImports] = useState<PfStatementImportRow[]>([]);
  const [importLines, setImportLines] = useState<PfStatementLineRow[]>([]);
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flowFilter, setFlowFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");

  const [manualOpen, setManualOpen] = useState(false);
  const [mFlow, setMFlow] = useState<"in" | "out">("out");
  const [mCategory, setMCategory] = useState("misc");
  const [mAmount, setMAmount] = useState<number | undefined>(undefined);
  const [mTitle, setMTitle] = useState("");
  const [mNotes, setMNotes] = useState("");
  const [mDate, setMDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [loanOpen, setLoanOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<PfLoanRow | null>(null);
  const [loanKind, setLoanKind] = useState<PfLoanRow["loanKind"]>("borrowed_person");
  const [loanParty, setLoanParty] = useState("");
  const [loanPrincipal, setLoanPrincipal] = useState<number | undefined>(undefined);
  const [loanNotes, setLoanNotes] = useState("");
  const [loanDue, setLoanDue] = useState("");

  const [repayOpen, setRepayOpen] = useState(false);
  const [repayLoan, setRepayLoan] = useState<PfLoanRow | null>(null);
  const [repayAmount, setRepayAmount] = useState<number | undefined>(undefined);
  const [repayDate, setRepayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [repayNotes, setRepayNotes] = useState("");
  const [repayHistory, setRepayHistory] = useState<PfLoanRepaymentRow[]>([]);

  const [subOpen, setSubOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<PfSubscriptionRow | null>(null);
  const [subName, setSubName] = useState("");
  const [subAmount, setSubAmount] = useState<number | undefined>(undefined);
  const [subCycle, setSubCycle] = useState<string>("monthly");
  const [subNext, setSubNext] = useState("");
  const [subAuto, setSubAuto] = useState(true);
  const [subCat, setSubCat] = useState("subscriptions");
  const [subNotes, setSubNotes] = useState("");

  const { from, to } = useMemo(() => utcMonthRange(month), [month]);

  const txnQuery = useMemo(() => {
    const q = new URLSearchParams();
    q.set("from", from);
    q.set("to", to);
    q.set("limit", "200");
    if (flowFilter) q.set("flow", flowFilter);
    if (categoryFilter) q.set("category", categoryFilter);
    if (search.trim()) q.set("search", search.trim());
    return q.toString();
  }, [from, to, flowFilter, categoryFilter, search]);

  const refreshCore = useCallback(async () => {
    getApiBase();
    const [sum, act, tx, ln, sub, im] = await Promise.all([
      fetchJson<PfSummaryResponse>(`${API_PERSONAL_FINANCE}/summary?month=${encodeURIComponent(month)}`),
      fetchJson<PfActivityItem[]>(
        `${API_PERSONAL_FINANCE}/activity?month=${encodeURIComponent(month)}`
      ),
      fetchJson<PfTransactionRow[]>(`${API_PERSONAL_FINANCE}/transactions?${txnQuery}`),
      fetchJson<PfLoanRow[]>(`${API_PERSONAL_FINANCE}/loans`),
      fetchJson<PfSubscriptionRow[]>(`${API_PERSONAL_FINANCE}/subscriptions`),
      fetchJson<PfStatementImportRow[]>(`${API_PERSONAL_FINANCE}/imports`),
    ]);
    setSummary(sum);
    setActivity(act);
    setTransactions(tx);
    setLoans(ln);
    setSubscriptions(sub);
    setImports(im);
  }, [month, txnQuery]);

  const refreshLines = useCallback(async () => {
    if (!selectedImportId) {
      setImportLines([]);
      return;
    }
    const lines = await fetchJson<PfStatementLineRow[]>(
      `${API_PERSONAL_FINANCE}/imports/${selectedImportId}/lines`
    );
    setImportLines(Array.isArray(lines) ? lines : []);
  }, [selectedImportId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await refreshCore();
        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) {
          toast.error();
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshCore]);

  useEffect(() => {
    void refreshLines();
  }, [refreshLines]);

  async function onUpload(csvText: string, fileName: string) {
    setBusy(true);
    try {
      const res = await apiPost<{ import: PfStatementImportRow }>(`${API_PERSONAL_FINANCE}/imports`, {
        csvText,
        fileName,
      });
      toast.saved();
      await refreshCore();
      if (res?.import?._id) setSelectedImportId(res.import._id);
    } catch {
      toast.error();
    } finally {
      setBusy(false);
    }
  }

  async function onApproveLine(lineId: string, category: string, title: string) {
    if (!selectedImportId) return;
    setBusy(true);
    try {
      await apiPost(`${API_PERSONAL_FINANCE}/imports/${selectedImportId}/lines/${lineId}/approve`, {
        category,
        title,
      });
      toast.saved();
      await refreshCore();
      await refreshLines();
    } catch {
      toast.error();
    } finally {
      setBusy(false);
    }
  }

  async function onRejectLine(lineId: string) {
    if (!selectedImportId) return;
    setBusy(true);
    try {
      await apiPost(`${API_PERSONAL_FINANCE}/imports/${selectedImportId}/lines/${lineId}/reject`, {});
      toast.updated();
      await refreshLines();
    } catch {
      toast.error();
    } finally {
      setBusy(false);
    }
  }

  async function saveManual() {
    if (mAmount == null || mAmount <= 0) return;
    setBusy(true);
    try {
      await apiPost(`${API_PERSONAL_FINANCE}/transactions`, {
        flow: mFlow,
        category: mCategory,
        amount: mAmount,
        occurredAt: new Date(mDate).toISOString(),
        title: mTitle || mCategory,
        notes: mNotes,
        source: "manual",
      });
      toast.saved();
      setManualOpen(false);
      await refreshCore();
    } catch {
      toast.error();
    } finally {
      setBusy(false);
    }
  }

  async function saveLoan() {
    if (!loanParty.trim() || loanPrincipal == null) return;
    setBusy(true);
    try {
      const body = {
        loanKind,
        partyName: loanParty.trim(),
        principal: loanPrincipal,
        notes: loanNotes,
        dueDate: loanDue ? new Date(loanDue).toISOString() : null,
      };
      if (editingLoan) {
        await apiPut(`${API_PERSONAL_FINANCE}/loans/${editingLoan._id}`, body);
        toast.updated();
      } else {
        await apiPost(`${API_PERSONAL_FINANCE}/loans`, body);
        toast.saved();
      }
      setLoanOpen(false);
      setEditingLoan(null);
      setLoanParty("");
      setLoanPrincipal(undefined);
      setLoanNotes("");
      setLoanDue("");
      await refreshCore();
    } catch {
      toast.error();
    } finally {
      setBusy(false);
    }
  }

  async function openRepayModal(loan: PfLoanRow) {
    setRepayLoan(loan);
    setRepayAmount(undefined);
    setRepayNotes("");
    setRepayDate(new Date().toISOString().slice(0, 10));
    setRepayOpen(true);
    try {
      const history = await apiGet<PfLoanRepaymentRow[]>(
        `${API_PERSONAL_FINANCE}/loans/${loan._id}/repayments`
      );
      setRepayHistory(Array.isArray(history) ? history : []);
    } catch {
      setRepayHistory([]);
    }
  }

  function payFullOutstanding() {
    if (!repayLoan) return;
    const out = Number(repayLoan.outstanding) || 0;
    if (out > 0) setRepayAmount(out);
  }

  async function saveRepayment() {
    if (!repayLoan || repayAmount == null || repayAmount <= 0) return;
    const outstanding = Number(repayLoan.outstanding) || 0;
    if (repayAmount > outstanding + 0.01) {
      toast.error();
      return;
    }
    setBusy(true);
    try {
      await apiPost<{ loan: PfLoanRow }>(`${API_PERSONAL_FINANCE}/loans/${repayLoan._id}/repayments`, {
        amount: repayAmount,
        paidAt: new Date(repayDate).toISOString(),
        notes: repayNotes,
      });
      toast.saved();
      setRepayOpen(false);
      setRepayLoan(null);
      setRepayAmount(undefined);
      setRepayNotes("");
      setRepayHistory([]);
      await refreshCore();
    } catch {
      toast.error();
    } finally {
      setBusy(false);
    }
  }

  async function deleteLoan(id: string) {
    if (!window.confirm("Delete this loan and all its repayments?")) return;
    setBusy(true);
    try {
      await apiDelete(`${API_PERSONAL_FINANCE}/loans/${id}`);
      toast.deleted();
      await refreshCore();
    } catch {
      toast.error();
    } finally {
      setBusy(false);
    }
  }

  async function saveSubscription() {
    if (!subName.trim() || subAmount == null) return;
    setBusy(true);
    try {
      const body = {
        name: subName.trim(),
        amount: subAmount,
        billingCycle: subCycle,
        nextDueDate: subNext ? new Date(subNext).toISOString() : null,
        autoRenew: subAuto,
        category: subCat,
        notes: subNotes,
      };
      if (editingSub) {
        await apiPut(`${API_PERSONAL_FINANCE}/subscriptions/${editingSub._id}`, body);
        toast.updated();
      } else {
        await apiPost(`${API_PERSONAL_FINANCE}/subscriptions`, body);
        toast.saved();
      }
      setSubOpen(false);
      setEditingSub(null);
      setSubName("");
      setSubAmount(undefined);
      setSubNext("");
      setSubNotes("");
      await refreshCore();
    } catch {
      toast.error();
    } finally {
      setBusy(false);
    }
  }

  async function deleteSubscription(id: string) {
    if (!window.confirm("Delete this subscription?")) return;
    setBusy(true);
    try {
      await apiDelete(`${API_PERSONAL_FINANCE}/subscriptions/${id}`);
      toast.deleted();
      await refreshCore();
    } catch {
      toast.error();
    } finally {
      setBusy(false);
    }
  }

  async function deleteTransaction(id: string) {
    if (!window.confirm("Delete this ledger entry?")) return;
    setBusy(true);
    try {
      await apiDelete(`${API_PERSONAL_FINANCE}/transactions/${id}`);
      toast.deleted();
      await refreshCore();
    } catch {
      toast.error();
    } finally {
      setBusy(false);
    }
  }

  const subRows = subscriptions;
  const insightLines = summary?.insights || [];
  const monthLabel = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    if (!y || !m) return month;
    return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
  }, [month]);

  return (
    <div className={`min-w-0 ${stackSections}`}>
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className={PAGE_TITLE_CLASS}>Personal Finance</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Your private operating layer for cash, debt, subscriptions, and imports — aligned with the same ROOTKIT FINANCE shell as the rest of the admin app.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">
            Month
            <input
              type="month"
              className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
          <Button type="button" variant="secondary" className="rounded-full" disabled={loading} onClick={() => void refreshCore()}>
            Refresh
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          <div className="h-28 animate-pulse rounded-[20px] bg-slate-100" />
          <div className="h-64 animate-pulse rounded-[20px] bg-slate-100" />
        </div>
      ) : (
        <>
          <PfPositionKpi position={summary?.personalPosition} monthLabel={monthLabel} />
          <PfRootkitMoneySection data={summary?.rootkitBusiness} monthLabel={monthLabel} />
          <PfLinkedFlowsSection data={summary?.linkedFlows} monthLabel={monthLabel} />
          <PfKpiSection kpis={summary?.kpis ?? null} />
          <PfCashflowCharts series={summary?.cashflowSeries ?? []} categories={summary?.categoryBreakdown ?? []} />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PfInsightsBlock lines={insightLines} />
            </div>
            <PfActivityBlock items={activity} />
          </div>
          <PfLoansSection
            loans={loans}
            rootkitBusiness={summary?.rootkitBusiness}
            personalPosition={summary?.personalPosition}
            onAdd={() => {
              setEditingLoan(null);
              setLoanKind("borrowed_person");
              setLoanParty("");
              setLoanPrincipal(undefined);
              setLoanNotes("");
              setLoanDue("");
              setLoanOpen(true);
            }}
            onRepay={(l) => void openRepayModal(l)}
            onEdit={(l) => {
              setEditingLoan(l);
              setLoanKind(l.loanKind);
              setLoanParty(l.partyName);
              setLoanPrincipal(l.principal);
              setLoanNotes(l.notes || "");
              setLoanDue(l.dueDate ? String(l.dueDate).slice(0, 10) : "");
              setLoanOpen(true);
            }}
            onDelete={deleteLoan}
          />
          <PfSubscriptionsSection
            rows={subRows}
            upcoming={summary?.subscriptions.upcoming ?? []}
            overdue={summary?.subscriptions.overdue ?? []}
            monthlyEquiv={summary?.subscriptions.monthlyEquivalentEstimate ?? 0}
            onAdd={() => {
              setEditingSub(null);
              setSubName("");
              setSubAmount(undefined);
              setSubCycle("monthly");
              setSubNext("");
              setSubAuto(true);
              setSubCat("subscriptions");
              setSubNotes("");
              setSubOpen(true);
            }}
            onEdit={(s) => {
              setEditingSub(s);
              setSubName(s.name);
              setSubAmount(s.amount);
              setSubCycle(s.billingCycle);
              setSubNext(s.nextDueDate ? String(s.nextDueDate).slice(0, 10) : "");
              setSubAuto(s.autoRenew);
              setSubCat(s.category);
              setSubNotes(s.notes || "");
              setSubOpen(true);
            }}
            onDelete={deleteSubscription}
          />
          <PfImportSection
            imports={imports}
            lines={importLines}
            selectedImportId={selectedImportId}
            onSelectImport={setSelectedImportId}
            onUpload={onUpload}
            onApprove={onApproveLine}
            onReject={onRejectLine}
            busy={busy}
          />
          <PfTransactionsSection
            rows={transactions}
            flowFilter={flowFilter}
            categoryFilter={categoryFilter}
            search={search}
            onFlowChange={setFlowFilter}
            onCategoryChange={setCategoryFilter}
            onSearchChange={setSearch}
            onAddManual={() => setManualOpen(true)}
            onDelete={deleteTransaction}
          />
        </>
      )}

      <Modal
        open={manualOpen}
        title="Quick ledger entry"
        onClose={() => setManualOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setManualOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveManual()} disabled={busy}>
              Save
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Flow">
            <Select value={mFlow} onChange={(e) => setMFlow(e.target.value as "in" | "out")}>
              <option value="in">Money in</option>
              <option value="out">Money out</option>
            </Select>
          </FormField>
          <FormField label="Category">
            <Select value={mCategory} onChange={(e) => setMCategory(e.target.value)}>
              <option value="personal_income">personal_income</option>
              <option value="rootkit_income">rootkit_income</option>
              <option value="food">food</option>
              <option value="travel">travel</option>
              <option value="subscriptions">subscriptions</option>
              <option value="recharge">recharge</option>
              <option value="utilities">utilities</option>
              <option value="personal_shopping">personal_shopping</option>
              <option value="business_expense">business_expense</option>
              <option value="loan_repayment">loan_repayment</option>
              <option value="transfer">transfer</option>
              <option value="misc">misc</option>
            </Select>
          </FormField>
          <FormField label="Amount" className="sm:col-span-2">
            <FormattedNumberInput value={mAmount} onChange={setMAmount} />
          </FormField>
          <FormField label="Date">
            <Input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} />
          </FormField>
          <FormField label="Title">
            <Input value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="Short label" />
          </FormField>
          <FormField label="Notes" className="sm:col-span-2">
            <Input value={mNotes} onChange={(e) => setMNotes(e.target.value)} placeholder="Optional" />
          </FormField>
        </div>
      </Modal>

      <Modal
        open={loanOpen}
        title={editingLoan ? "Edit loan / lending" : "Add loan / lending record"}
        onClose={() => {
          setLoanOpen(false);
          setEditingLoan(null);
        }}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setLoanOpen(false);
                setEditingLoan(null);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveLoan()} disabled={busy}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Type">
            <Select value={loanKind} onChange={(e) => setLoanKind(e.target.value as PfLoanRow["loanKind"])}>
              <option value="borrowed_bank">Borrowed — bank</option>
              <option value="borrowed_person">Borrowed — person</option>
              <option value="lent_to_person">I lent — person owes me</option>
            </Select>
          </FormField>
          <FormField label="Counterparty name">
            <Input value={loanParty} onChange={(e) => setLoanParty(e.target.value)} placeholder="Bank or person" />
          </FormField>
          <FormField label="Principal amount">
            <FormattedNumberInput value={loanPrincipal} onChange={setLoanPrincipal} />
          </FormField>
          <FormField label="Due date (optional)">
            <Input type="date" value={loanDue} onChange={(e) => setLoanDue(e.target.value)} />
          </FormField>
          <FormField label="Notes">
            <Input value={loanNotes} onChange={(e) => setLoanNotes(e.target.value)} />
          </FormField>
        </div>
      </Modal>

      <Modal
        open={repayOpen}
        title={repayLoan?.loanKind === "lent_to_person" ? "Record amount received back" : "Record repayment"}
        onClose={() => setRepayOpen(false)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setRepayOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveRepayment()} disabled={busy}>
              Save
            </Button>
          </>
        }
      >
        {repayLoan ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm">
              <p className="font-semibold text-slate-900">{repayLoan.partyName}</p>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-slate-500">Principal</dt>
                  <dd className="font-semibold tabular-nums">{formatMoney(repayLoan.principal, "INR")}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Repaid</dt>
                  <dd className="font-semibold tabular-nums text-emerald-700">
                    {formatMoney(repayLoan.repaid ?? 0, "INR")}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Outstanding</dt>
                  <dd className="font-semibold tabular-nums text-rose-800">
                    {formatMoney(repayLoan.outstanding ?? 0, "INR")}
                  </dd>
                </div>
              </dl>
            </div>
            <FormField label="Amount">
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <FormattedNumberInput value={repayAmount} onChange={setRepayAmount} />
                </div>
                <Button type="button" variant="secondary" className="shrink-0 text-xs" onClick={payFullOutstanding}>
                  Pay full outstanding
                </Button>
              </div>
            </FormField>
            <FormField label="Date">
              <Input type="date" value={repayDate} onChange={(e) => setRepayDate(e.target.value)} />
            </FormField>
            <FormField label="Notes">
              <Input value={repayNotes} onChange={(e) => setRepayNotes(e.target.value)} />
            </FormField>
            {repayHistory.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Recent payments</p>
                <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-slate-100 bg-white p-2 text-xs">
                  {repayHistory.map((r) => (
                    <li key={r._id} className="flex justify-between gap-2 tabular-nums">
                      <span className="text-slate-600">{new Date(r.paidAt).toLocaleDateString("en-IN")}</span>
                      <span className="font-semibold text-slate-900">{formatMoney(r.amount, "INR")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={subOpen}
        title={editingSub ? "Edit subscription" : "Add subscription / recurring"}
        onClose={() => {
          setSubOpen(false);
          setEditingSub(null);
        }}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSubOpen(false);
                setEditingSub(null);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveSubscription()} disabled={busy}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Name">
            <Input value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="Netflix, hosting…" />
          </FormField>
          <FormField label="Amount">
            <FormattedNumberInput value={subAmount} onChange={setSubAmount} />
          </FormField>
          <FormField label="Billing cycle">
            <Select value={subCycle} onChange={(e) => setSubCycle(e.target.value)}>
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
              <option value="quarterly">quarterly</option>
              <option value="yearly">yearly</option>
              <option value="custom">custom</option>
            </Select>
          </FormField>
          <FormField label="Next due date">
            <Input type="date" value={subNext} onChange={(e) => setSubNext(e.target.value)} />
          </FormField>
          <FormField label="Category">
            <Input value={subCat} onChange={(e) => setSubCat(e.target.value)} />
          </FormField>
          <FormField label="Auto-renew">
            <Select value={subAuto ? "yes" : "no"} onChange={(e) => setSubAuto(e.target.value === "yes")}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
          </FormField>
          <FormField label="Notes">
            <Input value={subNotes} onChange={(e) => setSubNotes(e.target.value)} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
