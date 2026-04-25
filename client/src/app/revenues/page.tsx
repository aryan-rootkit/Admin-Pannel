"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/fetchApi";
import { apiDelete, apiPost, apiPut } from "@/lib/api";
import type { Project, RevenuePaymentType, RevenueRow } from "@/types/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate, formatMoney } from "@/lib/format";
import { resolveProjectName } from "@/lib/relations";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { REVENUE_PAYMENT_TYPES } from "@/lib/formOptions";
import { useToast } from "@/components/providers/ToastProvider";

function refId(v: string | { _id: string } | undefined | null): string {
  if (v == null) return "";
  return typeof v === "string" ? v : v._id;
}

function toInputDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function paymentLineAmount(r: RevenueRow): number {
  return Number(r.totalAmount ?? r.amount ?? 0) || 0;
}

type ProjectRevenueGroup = {
  projectId: string;
  projectName: string;
  payments: RevenueRow[];
  totalReceived: number;
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
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [paymentType, setPaymentType] = useState<RevenuePaymentType>("Installment");

  const load = useCallback(async () => {
    const [r, p] = await Promise.all([
      fetchJson<RevenueRow[]>("/revenues"),
      fetchJson<Project[]>("/projects"),
    ]);
    setRows(Array.isArray(r) ? r : []);
    setProjects(Array.isArray(p) ? p : []);
  }, []);

  const groupedByProject = useMemo((): ProjectRevenueGroup[] => {
    const map = new Map<string, ProjectRevenueGroup>();
    for (const r of rows) {
      const pid = refId(r.projectId);
      const name = resolveProjectName(r.projectId);
      if (!map.has(pid)) {
        map.set(pid, { projectId: pid, projectName: name, payments: [], totalReceived: 0 });
      }
      const g = map.get(pid)!;
      g.payments.push(r);
      g.totalReceived += paymentLineAmount(r);
    }
    for (const g of map.values()) {
      g.payments.sort(
        (a, b) =>
          new Date(b.paymentDate || b.receivedAt || 0).getTime() -
          new Date(a.paymentDate || a.receivedAt || 0).getTime()
      );
    }
    return [...map.values()].sort((a, b) =>
      a.projectName.localeCompare(b.projectName, undefined, { sensitivity: "base" })
    );
  }, [rows]);

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
    setProjectId(projects[0]?._id || "");
    setTotalAmount("");
    setAdvanceAmount("0");
    setPaymentDate(toInputDate(new Date().toISOString()));
    setCurrency("INR");
    setPaymentType("Installment");
    setModalOpen(true);
  }

  function openEdit(r: RevenueRow) {
    setEditingId(r._id);
    setProjectId(refId(r.projectId));
    setTotalAmount(String(r.totalAmount ?? r.amount ?? 0));
    setAdvanceAmount(String(r.advanceAmount ?? 0));
    setPaymentDate(toInputDate(r.paymentDate || r.receivedAt || null));
    setCurrency(r.currency || "INR");
    const pt = r.paymentType;
    setPaymentType(
      pt && (REVENUE_PAYMENT_TYPES as readonly string[]).includes(pt) ? pt : "Installment"
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
    const pending = Math.max(0, total - advance);
    const body = {
      projectId,
      totalAmount: total,
      advanceAmount: advance,
      pendingAmount: pending,
      paymentDate: paymentDate ? new Date(paymentDate).toISOString() : undefined,
      currency,
      paymentType,
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
    } catch {
      toast.error();
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
    } catch {
      toast.error();
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Revenues" />
        <Button type="button" onClick={openCreate} disabled={!projects.length}>
          Add payment
        </Button>
      </div>

      <p className="mb-4 max-w-2xl text-sm text-[var(--purity-muted)]">
        Each row is a <strong className="text-[var(--purity-text)]">payment</strong> (advance,
        installment, or final). Totals below are <strong className="text-[var(--purity-text)]">sum
        of payments</strong> per project.
      </p>

      {!projects.length && !loading ? (
        <p className="mb-4 text-sm text-amber-800">Create a project first.</p>
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

      {!loading && !error && rows.length === 0 ? (
        <div className="rounded-xl border border-[var(--purity-border)] bg-[var(--purity-card)] px-6 py-10 text-center text-sm text-[var(--purity-muted)]">
          No payment records yet.
        </div>
      ) : null}

      <div className="space-y-6">
        {!loading &&
          groupedByProject.map((g) => (
            <div
              key={g.projectId}
              className="overflow-hidden rounded-xl border border-[var(--purity-border)] bg-[var(--purity-card)] shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--purity-border)] bg-[var(--purity-sidebar-active)] px-4 py-3">
                <h2 className="text-sm font-bold text-[var(--purity-text)]">{g.projectName}</h2>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                    Total received
                  </p>
                  <p className="text-lg font-bold tabular-nums text-[var(--purity-text)]">
                    {formatMoney(g.totalReceived, "INR")}
                  </p>
                </div>
              </div>
              <ul className="divide-y divide-[var(--purity-border)]">
                {g.payments.map((r) => (
                  <li
                    key={r._id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-[var(--purity-text)]">
                        {formatMoney(paymentLineAmount(r), r.currency || "INR")}
                      </span>
                      <span className="ml-2 rounded-md bg-[var(--purity-sidebar-active)] px-2 py-0.5 text-xs font-medium text-[var(--purity-accent-hover)]">
                        {r.paymentType || "Installment"}
                      </span>
                      <span className="ml-2 text-xs text-[var(--purity-muted)]">
                        {formatDate(r.paymentDate || r.receivedAt)}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        className="text-xs font-bold uppercase tracking-wide text-[var(--purity-accent-hover)] hover:underline"
                        onClick={() => openEdit(r)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs font-bold uppercase tracking-wide text-red-600 hover:underline"
                        onClick={() => onDelete(r._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
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
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormField>
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
          <FormField label="Payment amount (this installment)">
            <Input
              inputMode="decimal"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
          </FormField>
          <FormField label="Advance amount (optional split)">
            <Input
              inputMode="decimal"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
            />
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
