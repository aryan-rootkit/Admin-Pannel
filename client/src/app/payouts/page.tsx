"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchApi";
import { apiDelete, apiPost, apiPut } from "@/lib/api";
import type { PersonRow, PayoutRow, Project } from "@/types/api";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  EmptyState,
  ListPanel,
  listBodyRowClass,
  listHeadRowClass,
} from "@/components/layout/ListPanel";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate, formatMoney } from "@/lib/format";
import {
  resolveClientLabel,
  resolvePayoutPerson,
  resolveProjectName,
} from "@/lib/relations";
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

export default function PayoutsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [kind, setKind] = useState<"subscription" | "payout">("payout");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [projectId, setProjectId] = useState("");
  const [peopleId, setPeopleId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [currency, setCurrency] = useState("INR");

  const load = useCallback(async () => {
    const [pay, p, t] = await Promise.all([
      fetchJson<PayoutRow[]>("/payouts"),
      fetchJson<Project[]>("/projects"),
      fetchJson<PersonRow[]>("/people"),
    ]);
    setRows(Array.isArray(pay) ? pay : []);
    setProjects(Array.isArray(p) ? p : []);
    setPeople(Array.isArray(t) ? t : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load payouts");
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
    setKind("payout");
    setName("");
    setStatus("active");
    setProjectId(projects[0]?._id || "");
    setPeopleId(people[0]?._id || "");
    setAmount("");
    setPaymentDate(toInputDate(new Date().toISOString()));
    setCurrency("INR");
    setModalOpen(true);
  }

  function openEdit(r: PayoutRow) {
    setEditingId(r._id);
    const t = r.type === "subscription" ? "subscription" : "payout";
    setKind(t);
    setName(r.name || "");
    setStatus(r.status || "active");
    setProjectId(refId(r.projectId));
    setPeopleId(refId(r.peopleId) || refId(r.personId));
    setAmount(String(r.amount ?? ""));
    setPaymentDate(toInputDate(r.paymentDate || r.paidAt || null));
    setCurrency(r.currency || "INR");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
  }

  async function onSave() {
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt < 0) {
      toast.error("Valid amount is required");
      return;
    }
    if (kind === "subscription" && !name.trim()) {
      toast.error("Name is required for subscriptions");
      return;
    }
    if (kind === "payout" && (!projectId || !peopleId)) {
      toast.error("Project and person are required for payouts");
      return;
    }
    setSaving(true);
    const pd = paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString();
    const body =
      kind === "subscription"
        ? {
            type: "subscription" as const,
            name: name.trim(),
            amount: amt,
            paymentDate: pd,
            status: status.trim() || "active",
            currency,
          }
        : {
            type: "payout" as const,
            projectId,
            peopleId,
            amount: amt,
            paymentDate: pd,
            currency,
          };
    try {
      if (editingId) {
        await apiPut(`/payouts/${editingId}`, body);
        toast.updated();
      } else {
        await apiPost("/payouts", body);
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
    if (!window.confirm("Delete this payout?")) return;
    try {
      await apiDelete(`/payouts/${id}`);
      toast.deleted();
      await load();
    } catch {
      toast.error();
    }
  }

  function typeLabel(p: PayoutRow) {
    if (p.type === "subscription") return "Subscription";
    if (p.type === "payout") return "Dev payout";
    return p.category || "—";
  }

  function relatedLine(p: PayoutRow) {
    if (p.type === "subscription") return p.name || "—";
    const person = resolvePayoutPerson(p);
    const project = resolveProjectName(p.projectId);
    const client = resolveClientLabel(p.clientId);
    const bits = [person !== "—" ? person : null, project !== "—" ? project : null, client || null].filter(
      Boolean
    );
    return bits.length ? bits.join(" · ") : "—";
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Payouts" />
        <Button type="button" onClick={openCreate}>
          Add new
        </Button>
      </div>

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
          <div className="col-span-2">Amount</div>
          <div className="col-span-3">Type</div>
          <div className="col-span-3">Related</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {!loading && !error && rows.length === 0 ? (
          <EmptyState message="No data" />
        ) : null}
        {!loading &&
          rows.map((r) => (
            <div key={r._id} className={`${listBodyRowClass()} grid-cols-12`}>
              <div className="col-span-2 font-semibold text-[var(--purity-text)]">
                {formatMoney(Number(r.amount) || 0, r.currency || "INR")}
              </div>
              <div className="col-span-3 text-[var(--purity-muted)]">
                {typeLabel(r)}
                {r.type === "subscription" && r.status ? (
                  <div className="text-[10px] text-[var(--purity-muted)]">{r.status}</div>
                ) : null}
              </div>
              <div className="col-span-3 text-xs text-[var(--purity-muted)]">{relatedLine(r)}</div>
              <div className="col-span-2 text-xs text-[var(--purity-muted)]">
                {formatDate(r.paymentDate || r.paidAt)}
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
        title={editingId ? "Edit payout" : "New payout"}
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
          <FormField label="Kind">
            <Select
              value={kind}
              onChange={(e) => setKind(e.target.value as "subscription" | "payout")}
            >
              <option value="payout">Dev payout</option>
              <option value="subscription">Subscription</option>
            </Select>
          </FormField>
          {kind === "subscription" ? (
            <>
              <FormField label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField label="Status">
                <Input value={status} onChange={(e) => setStatus(e.target.value)} />
              </FormField>
            </>
          ) : (
            <>
              <FormField label="Project">
                <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Person">
                <Select value={peopleId} onChange={(e) => setPeopleId(e.target.value)}>
                  <option value="">Select person</option>
                  {people.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name || m.email || m._id}
                    </option>
                  ))}
                </Select>
              </FormField>
            </>
          )}
          <FormField label="Amount">
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </FormField>
          <FormField label="Payment date">
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </FormField>
          <FormField label="Currency">
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
