"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchApi";
import { apiDelete, apiPost, apiPut } from "@/lib/api";
import type { Project, RevenueRow } from "@/types/api";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  EmptyState,
  ListPanel,
  listBodyRowClass,
  listHeadRowClass,
} from "@/components/layout/ListPanel";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate, formatMoney } from "@/lib/format";
import { resolveProjectName } from "@/lib/relations";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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

  const load = useCallback(async () => {
    const [r, p] = await Promise.all([
      fetchJson<RevenueRow[]>("/revenues"),
      fetchJson<Project[]>("/projects"),
    ]);
    setRows(Array.isArray(r) ? r : []);
    setProjects(Array.isArray(p) ? p : []);
  }, []);

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
    setModalOpen(true);
  }

  function openEdit(r: RevenueRow) {
    setEditingId(r._id);
    setProjectId(refId(r.projectId));
    setTotalAmount(String(r.totalAmount ?? r.amount ?? 0));
    setAdvanceAmount(String(r.advanceAmount ?? 0));
    setPaymentDate(toInputDate(r.paymentDate || r.receivedAt || null));
    setCurrency(r.currency || "INR");
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
      toast.error("Valid total amount is required");
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
    if (!window.confirm("Delete this revenue record?")) return;
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
          Add new
        </Button>
      </div>

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

      <ListPanel>
        <div className={`${listHeadRowClass()} grid-cols-12`}>
          <div className="col-span-2">Total</div>
          <div className="col-span-2">Advance</div>
          <div className="col-span-2">Pending</div>
          <div className="col-span-3">Project</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {!loading && !error && rows.length === 0 ? (
          <EmptyState message="No data" />
        ) : null}
        {!loading &&
          rows.map((r) => (
            <div key={r._id} className={`${listBodyRowClass()} grid-cols-12`}>
              <div className="col-span-2 font-semibold text-[var(--purity-text)]">
                {formatMoney(r.totalAmount ?? r.amount ?? 0, r.currency || "INR")}
              </div>
              <div className="col-span-2 text-[var(--purity-muted)]">
                {formatMoney(r.advanceAmount ?? 0, r.currency || "INR")}
              </div>
              <div className="col-span-2 text-[var(--purity-muted)]">
                {formatMoney(
                  r.pendingAmount ??
                    Math.max(0, (r.totalAmount ?? r.amount ?? 0) - (r.advanceAmount ?? 0)),
                  r.currency || "INR"
                )}
              </div>
              <div className="col-span-3 text-[var(--purity-muted)]">
                {resolveProjectName(r.projectId)}
              </div>
              <div className="col-span-1 text-xs text-[var(--purity-muted)]">
                {formatDate(r.paymentDate || r.receivedAt)}
              </div>
              <div className="col-span-2 flex justify-end gap-2">
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
            </div>
          ))}
      </ListPanel>

      <Modal
        open={modalOpen}
        title={editingId ? "Edit revenue" : "New revenue"}
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
          <FormField label="Total amount">
            <Input
              inputMode="decimal"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
          </FormField>
          <FormField label="Advance amount">
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
