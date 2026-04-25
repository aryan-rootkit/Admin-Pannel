"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchJson, getApiBase } from "@/lib/fetchApi";
import { ApiError, apiDelete, apiPost, apiPut } from "@/lib/api";
import type { Project, RevenuePaymentType, RevenueRow, RevenueStatus } from "@/types/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate, formatMoney } from "@/lib/format";
import { resolveProjectName } from "@/lib/relations";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { REVENUE_PAYMENT_TYPES, REVENUE_STATUS_OPTIONS } from "@/lib/formOptions";
import {
  displayFinancialStatus,
  projectReceivesNewPayments,
  projectStatusBucket,
  type FinancialLifecycle,
} from "@/lib/projectFinance";
import { useToast } from "@/components/providers/ToastProvider";

function refId(v: string | { _id: string } | undefined | null): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  const id = (v as { _id?: unknown })._id;
  return id == null ? "" : String(id);
}

function toInputDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function paymentLineAmount(r: RevenueRow): number {
  return Number(r.amount ?? r.totalAmount ?? 0) || 0;
}

function paymentReceivedInGroup(r: RevenueRow): number {
  const st = r.status || "Received";
  if (st !== "Received") return 0;
  return paymentLineAmount(r);
}

/** Persists client debug NDJSON via API (session header required server-side). */
function mirrorClientDebugLog(payload: Record<string, unknown>) {
  try {
    const base = getApiBase();
    fetch(`${base}/debug-session-log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "978955",
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    /* missing NEXT_PUBLIC_API_BASE_URL */
  }
}

function statusBadgeClass(s: FinancialLifecycle): string {
  if (s === "Cancelled") return "bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200";
  if (s === "Completed") return "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100";
  return "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100";
}

type ProjectRevenueGroup = {
  projectId: string;
  projectName: string;
  project?: Project;
  payments: RevenueRow[];
  totalReceived: number;
  totalProjectValue: number;
  pendingAmount: number;
  cancelledBalance: number;
  financialStatus: FinancialLifecycle;
};

export default function RevenuesPage() {
  const toast = useToast();
  const [rows, setRows] = useState<RevenueRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("0");
  const [paymentDate, setPaymentDate] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [paymentType, setPaymentType] = useState<RevenuePaymentType>("Installment");
  const [status, setStatus] = useState<RevenueStatus>("Received");

  const load = useCallback(async () => {
    const [r, p] = await Promise.all([
      fetchJson<RevenueRow[]>("/revenues"),
      fetchJson<Project[]>("/projects"),
    ]);
    const rowArr = Array.isArray(r) ? r : [];
    const projArr = Array.isArray(p) ? p : [];
    // #region agent log
    fetch("http://127.0.0.1:7810/ingest/2353a7f2-1034-4773-8e38-18bdf10d5d38", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "978955",
      },
      body: JSON.stringify({
        sessionId: "978955",
        runId: "post-fix",
        hypothesisId: "H2,H3,H4",
        location: "revenues/page.tsx:load",
        message: "revenues/projects fetch merged",
        data: {
          revenueRows: rowArr.length,
          projects: projArr.length,
          projectIdShapes: rowArr.slice(0, 30).map((x) => ({
            kind: typeof x.projectId,
            isObj: typeof x.projectId === "object" && x.projectId !== null,
          })),
          amountFieldZeros: rowArr.filter((x) => {
            const a = Number(x.amount ?? x.totalAmount ?? 0) || 0;
            return a === 0;
          }).length,
        },
      }),
    }).catch(() => {});
    mirrorClientDebugLog({
      sessionId: "978955",
      runId: "post-fix",
      hypothesisId: "H2,H3,H4",
      location: "revenues/page.tsx:load",
      message: "revenues/projects fetch merged",
      data: {
        revenueRows: rowArr.length,
        projects: projArr.length,
        projectIdShapes: rowArr.slice(0, 30).map((x) => ({
          kind: typeof x.projectId,
          isObj: typeof x.projectId === "object" && x.projectId !== null,
        })),
        amountFieldZeros: rowArr.filter((x) => {
          const a = Number(x.amount ?? x.totalAmount ?? 0) || 0;
          return a === 0;
        }).length,
      },
    });
    // #endregion
    setRows(rowArr);
    setProjects(projArr);
  }, []);

  const canRecordNewPayments = useMemo(
    () => projects.some((p) => projectReceivesNewPayments(p.status)),
    [projects]
  );

  const groupedByProject = useMemo((): ProjectRevenueGroup[] => {
    const map = new Map<string, ProjectRevenueGroup>();

    for (const p of projects) {
      const tv = Math.max(0, Number(p.totalValue ?? p.budget ?? 0) || 0);
      map.set(p._id, {
        projectId: p._id,
        projectName: p.name || "—",
        project: p,
        payments: [],
        totalReceived: 0,
        totalProjectValue: tv,
        pendingAmount: 0,
        cancelledBalance: 0,
        financialStatus: displayFinancialStatus(p.status),
      });
    }

    for (const r of rows) {
      const pid = refId(r.projectId);
      if (!map.has(pid)) {
        map.set(pid, {
          projectId: pid,
          projectName: resolveProjectName(r.projectId),
          project: undefined,
          payments: [],
          totalReceived: 0,
          totalProjectValue: 0,
          pendingAmount: 0,
          cancelledBalance: 0,
          financialStatus: "Active",
        });
      }
      const g = map.get(pid)!;
      g.payments.push(r);
      g.totalReceived += paymentReceivedInGroup(r);
    }

    for (const g of map.values()) {
      const received = Math.max(0, g.totalReceived);
      const tv = g.project
        ? Math.max(0, Number(g.project.totalValue ?? g.project.budget ?? 0) || 0)
        : Math.max(0, g.totalProjectValue);
      g.totalProjectValue = tv;
      const rawGap = Math.max(0, tv - received);
      const bucket = projectStatusBucket(g.project?.status);
      if (bucket === "cancelled") {
        g.cancelledBalance = rawGap;
        g.pendingAmount = 0;
      } else {
        g.pendingAmount = rawGap;
        g.cancelledBalance = 0;
      }
      if (g.project) g.financialStatus = displayFinancialStatus(g.project.status);

      g.payments.sort(
        (a, b) =>
          new Date(b.date || b.paymentDate || b.receivedAt || 0).getTime() -
          new Date(a.date || a.paymentDate || a.receivedAt || 0).getTime()
      );
    }

    const sorted = [...map.values()].sort((a, b) =>
      a.projectName.localeCompare(b.projectName, undefined, { sensitivity: "base" })
    );
    // #region agent log
    fetch("http://127.0.0.1:7810/ingest/2353a7f2-1034-4773-8e38-18bdf10d5d38", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "978955",
      },
      body: JSON.stringify({
        sessionId: "978955",
        runId: "post-fix",
        hypothesisId: "H2,H3,H5",
        location: "revenues/page.tsx:groupedByProject",
        message: "UI revenue groups computed",
        data: {
          rowCount: rows.length,
          projectCount: projects.length,
          groups: sorted.map((g) => {
            const sumAllLines = g.payments.reduce((s, r) => s + paymentLineAmount(r), 0);
            const sumReceivedLines = g.payments.reduce(
              (s, r) => s + paymentReceivedInGroup(r),
              0
            );
            return {
              projectId: g.projectId,
              hasProjectRef: Boolean(g.project),
              rawProjectStatus: g.project?.status ?? null,
              financialStatus: g.financialStatus,
              totalProjectValue: g.totalProjectValue,
              totalReceived: g.totalReceived,
              pendingAmount: g.pendingAmount,
              cancelledBalance: g.cancelledBalance,
              paymentLines: g.payments.length,
              sumAllLines,
              sumReceivedLines,
              mismatchAllVsReceived: sumAllLines !== sumReceivedLines,
            };
          }),
        },
      }),
    }).catch(() => {});
    mirrorClientDebugLog({
      sessionId: "978955",
      runId: "post-fix",
      hypothesisId: "H2,H3,H5",
      location: "revenues/page.tsx:groupedByProject",
      message: "UI revenue groups computed",
      data: {
        rowCount: rows.length,
        projectCount: projects.length,
        groups: sorted.map((g) => {
          const sumAllLines = g.payments.reduce((s, r) => s + paymentLineAmount(r), 0);
          const sumReceivedLines = g.payments.reduce((s, r) => s + paymentReceivedInGroup(r), 0);
          return {
            projectId: g.projectId,
            hasProjectRef: Boolean(g.project),
            rawProjectStatus: g.project?.status ?? null,
            financialStatus: g.financialStatus,
            totalProjectValue: g.totalProjectValue,
            totalReceived: g.totalReceived,
            pendingAmount: g.pendingAmount,
            cancelledBalance: g.cancelledBalance,
            paymentLines: g.payments.length,
            sumAllLines,
            sumReceivedLines,
            mismatchAllVsReceived: sumAllLines !== sumReceivedLines,
          };
        }),
      },
    });
    // #endregion
    return sorted;
  }, [rows, projects]);

  const modalProjectOptions = useMemo(() => {
    if (!editingId) return projects.filter((p) => projectReceivesNewPayments(p.status));
    return projects.filter(
      (p) => projectReceivesNewPayments(p.status) || p._id === projectId
    );
  }, [projects, editingId, projectId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load revenues");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  function openCreate() {
    setEditingId(null);
    const first = projects.find((p) => projectReceivesNewPayments(p.status));
    setProjectId(first?._id || "");
    setTotalAmount("");
    setAdvanceAmount("0");
    setPaymentDate(toInputDate(new Date().toISOString()));
    setCurrency("INR");
    setPaymentType("Installment");
    setStatus("Received");
    setModalOpen(true);
  }

  function openEdit(r: RevenueRow) {
    setEditingId(r._id);
    setProjectId(refId(r.projectId));
    setTotalAmount(String(r.totalAmount ?? r.amount ?? 0));
    setAdvanceAmount(String(r.advanceAmount ?? 0));
    setPaymentDate(toInputDate(r.date || r.paymentDate || r.receivedAt || null));
    setCurrency(r.currency || "INR");
    const pt = r.paymentType || r.type;
    setPaymentType(
      pt && (REVENUE_PAYMENT_TYPES as readonly string[]).includes(pt) ? pt : "Installment"
    );
    const st = r.status;
    setStatus(
      st && (REVENUE_STATUS_OPTIONS as readonly string[]).includes(st)
        ? (st as RevenueStatus)
        : "Received"
    );
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
  }

  async function onSave() {
    if (!projectId) {
      toast.error("Project is required");
      return;
    }
    const total = Number(totalAmount);
    if (Number.isNaN(total) || total < 0) {
      toast.error("Valid payment amount is required");
      return;
    }
    setSaving(true);
    const advance = Number(advanceAmount) || 0;
    const linePending = Math.max(0, total - advance);
    const isoDate = paymentDate ? new Date(paymentDate).toISOString() : undefined;
    const body = {
      projectId,
      amount: total,
      totalAmount: total,
      advanceAmount: advance,
      pendingAmount: linePending,
      date: isoDate,
      paymentDate: isoDate,
      currency,
      paymentType,
      status,
    };
    try {
      if (editingId) {
        await apiPut(`/revenues/${editingId}`, body);
        toast.updated();
      } else {
        await apiPost("/revenues", body);
        toast.saved();
      }
      await load();
      closeModal();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : undefined;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this payment record?")) return;
    try {
      await apiDelete(`/revenues/${id}`);
      toast.deleted();
      await load();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : undefined;
      toast.error(msg);
    }
  }

  return (
    <div className="min-w-0">
      <PageToolbar
        title={<PageHeader title="Revenues" className="mb-0" />}
        actions={
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={openCreate}
            disabled={!projects.length || !canRecordNewPayments}
          >
            Add payment
          </Button>
        }
      />

      <p className="mb-4 max-w-2xl text-sm leading-relaxed text-[var(--purity-muted)]">
        Per project, <strong className="text-[var(--purity-text)]">contract value</strong> and{" "}
        <strong className="text-[var(--purity-text)]">pending</strong> are computed from the
        project record and the sum of payments with status{" "}
        <strong className="text-[var(--purity-text)]">Received</strong>. Each line is one payment
        (advance, installment, or final).
      </p>

      {!projects.length && !loading ? (
        <p className="mb-4 text-sm text-amber-800">Create a project first.</p>
      ) : null}
      {projects.length > 0 && !canRecordNewPayments && !loading ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No active projects — you cannot add new payments. You can still edit or delete existing
          lines, or move a payment to an active project.
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--purity-muted)]">
          <Spinner />
          Loading…
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && rows.length === 0 && projects.length > 0 ? (
        <p className="mb-4 text-sm text-[var(--purity-muted)]">
          No payment lines yet. Summary rows still show each project&apos;s contract and pending.
        </p>
      ) : null}

      <div className="space-y-6">
        {!loading &&
          groupedByProject.map((g) => (
            <div
              key={g.projectId}
              className="min-w-0 overflow-hidden rounded-xl border border-[var(--purity-border)] bg-[var(--purity-card)] shadow-sm"
            >
              <div className="border-b border-[var(--purity-border)] bg-[var(--purity-sidebar-active)] px-4 py-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-[var(--purity-text)]">{g.projectName}</h2>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${statusBadgeClass(g.financialStatus)}`}
                  >
                    {g.financialStatus}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                      Total project value
                    </p>
                    <p className="mt-0.5 text-base font-bold tabular-nums text-[var(--purity-text)]">
                      {formatMoney(g.totalProjectValue, "INR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                      Total received
                    </p>
                    <p className="mt-0.5 text-base font-bold tabular-nums text-[var(--purity-text)]">
                      {formatMoney(g.totalReceived, "INR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                      {g.financialStatus === "Cancelled" ? "Cancelled balance" : "Pending"}
                    </p>
                    <p
                      className={`mt-0.5 text-base font-bold tabular-nums ${
                        g.financialStatus === "Cancelled"
                          ? "text-amber-800 dark:text-amber-200"
                          : g.pendingAmount <= 0
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-[var(--purity-text)]"
                      }`}
                    >
                      {formatMoney(
                        g.financialStatus === "Cancelled" ? g.cancelledBalance : g.pendingAmount,
                        "INR"
                      )}
                    </p>
                  </div>
                </div>
                {g.financialStatus === "Cancelled" ? (
                  <p className="mt-3 text-xs text-[var(--purity-muted)]">
                    Cancelled: no new payments. Remaining contract vs received is shown as cancelled
                    balance (not expected revenue). You may still edit existing payment lines.
                  </p>
                ) : null}
              </div>
              {g.payments.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[var(--purity-muted)]">No payment lines yet.</p>
              ) : (
                <ul className="divide-y divide-[var(--purity-border)]">
                  {g.payments.map((r) => (
                    <li
                      key={r._id}
                      className="flex flex-col gap-3 px-4 py-4 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-[var(--purity-text)]">
                          {formatMoney(paymentLineAmount(r), r.currency || "INR")}
                        </span>
                        <span className="ml-2 rounded-md bg-[var(--purity-sidebar-active)] px-2 py-0.5 text-xs font-medium text-[var(--purity-accent-hover)]">
                          {r.paymentType || r.type || "Installment"}
                        </span>
                        <span
                          className={`ml-2 rounded-md px-2 py-0.5 text-xs font-medium ${
                            r.status === "Pending"
                              ? "bg-amber-100 text-amber-900"
                              : r.status === "Failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          {r.status || "Received"}
                        </span>
                        <span className="ml-2 text-xs text-[var(--purity-muted)]">
                          {formatDate(r.date || r.paymentDate || r.receivedAt)}
                        </span>
                      </div>
                      <div className="flex w-full shrink-0 gap-2 sm:w-auto sm:justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-11 flex-1 sm:min-h-10 sm:flex-none sm:px-3"
                          onClick={() => openEdit(r)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          className="min-h-11 flex-1 sm:min-h-10 sm:flex-none sm:px-3"
                          onClick={() => onDelete(r._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {g.payments.length > 0 ? (
                <div className="flex flex-col gap-1 border-t border-[var(--purity-border)] bg-[var(--purity-card)] px-4 py-3 text-xs text-[var(--purity-muted)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:py-2.5">
                  <span className="min-w-0 break-words">
                    Received {formatMoney(g.totalReceived, "INR")} ·{" "}
                    {g.financialStatus === "Cancelled" ? "Cancelled balance" : "Pending"}{" "}
                    {formatMoney(
                      g.financialStatus === "Cancelled" ? g.cancelledBalance : g.pendingAmount,
                      "INR"
                    )}
                  </span>
                  <span className="tabular-nums">
                    Contract {formatMoney(g.totalProjectValue, "INR")}
                  </span>
                </div>
              ) : null}
            </div>
          ))}
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? "Edit payment" : "Record payment"}
        onClose={closeModal}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="button" onClick={onSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Project">
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
              <option value="">Select project</option>
              {modalProjectOptions.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                  {!projectReceivesNewPayments(p.status) ? " (not active)" : ""}
                </option>
              ))}
            </Select>
          </FormField>
          <p className="text-xs text-[var(--purity-muted)]">
            Project-level pending is computed automatically (contract value minus all received
            payments). It cannot be edited here.
          </p>
          <FormField label="Payment type">
            <Select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as RevenuePaymentType)}
            >
              {REVENUE_PAYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Status">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as RevenueStatus)}
            >
              {REVENUE_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Payment amount (this line)">
            <Input
              inputMode="decimal"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
          </FormField>
          <FormField label="Advance split on this line (optional, legacy)">
            <Input
              inputMode="decimal"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
            />
            <p className="mt-1 text-xs text-[var(--purity-muted)]">
              Stored on this row only; project pending comes from contract minus received.
            </p>
          </FormField>
          <FormField label="Payment date">
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </FormField>
          <FormField label="Currency">
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
