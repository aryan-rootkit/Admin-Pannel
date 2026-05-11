"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_PEOPLE, fetchJson } from "@/lib/fetchApi";
import { apiDelete, apiPost, apiPut } from "@/lib/api";
import type { PersonRow, PayoutRow, Project, RevenueRow } from "@/types/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { ResponsiveDataList } from "@/components/layout/ResponsiveDataList";
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
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";
import {
  PAYOUT_KIND_OPTIONS,
  payoutKindIsSubscription,
  type PayoutKindValue,
} from "@/lib/formOptions";
import {
  validateAmountPositive,
  validatePayoutKind,
  validatePayoutPerson,
  validatePayoutProject,
} from "@/lib/formValidation";
import { buildPayoutPayload, payoutRowToKind } from "@/lib/payoutPayload";
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

type PayoutFormErrors = {
  kind?: string;
  project?: string;
  person?: string;
  amount?: string;
};

export default function PayoutsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [revenues, setRevenues] = useState<RevenueRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [kind, setKind] = useState<PayoutKindValue>("dev_payout");
  const [projectId, setProjectId] = useState("");
  const [peopleId, setPeopleId] = useState("");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [paymentDate, setPaymentDate] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [fieldErrors, setFieldErrors] = useState<PayoutFormErrors>({});

  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterPeopleId, setFilterPeopleId] = useState("");

  const load = useCallback(async () => {
    const [pay, p, t, r] = await Promise.all([
      fetchJson<PayoutRow[]>("/payouts"),
      fetchJson<Project[]>("/projects"),
      fetchJson<PersonRow[]>(API_PEOPLE),
      fetchJson<RevenueRow[]>("/revenues"),
    ]);
    setRows(Array.isArray(pay) ? pay : []);
    setProjects(Array.isArray(p) ? p : []);
    setPeople(Array.isArray(t) ? t : []);
    setRevenues(Array.isArray(r) ? r : []);
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
    setKind("dev_payout");
    setProjectId("");
    setPeopleId("");
    setAmount(undefined);
    setPaymentDate(toInputDate(new Date().toISOString()));
    setCurrency("INR");
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(r: PayoutRow) {
    setEditingId(r._id);
    setKind(payoutRowToKind(r));
    setProjectId(refId(r.projectId));
    setPeopleId(refId(r.peopleId) || refId(r.personId));
    const a = Number(r.amount);
    setAmount(Number.isFinite(a) ? a : undefined);
    setPaymentDate(toInputDate(r.paymentDate || r.paidAt || null));
    setCurrency(r.currency || "INR");
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFieldErrors({});
  }

  function validatePayoutForm(): boolean {
    const next: PayoutFormErrors = {};
    const ke = validatePayoutKind(kind);
    if (ke) next.kind = ke;
    const ae = validateAmountPositive(amount);
    if (ae) next.amount = ae;
    const sub = payoutKindIsSubscription(kind);
    const pe = validatePayoutProject(projectId, sub);
    if (pe) next.project = pe;
    const per = validatePayoutPerson(peopleId, sub);
    if (per) next.person = per;
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSave() {
    if (!validatePayoutForm()) return;
    if (amount == null) return;
    setSaving(true);
    try {
      const body = buildPayoutPayload({
        kind,
        amount,
        paymentDate,
        currency,
        projectId,
        peopleId,
      });
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
    if (p.category && String(p.category).trim()) return String(p.category).trim();
    if (p.type === "subscription") return "Subscriptions";
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

  const showProjectPerson = !payoutKindIsSubscription(kind);

  const filteredSummary = useMemo(() => {
    const selectedProject = filterProjectId ? projects.find((p) => p._id === filterProjectId) : null;
    const selectedPerson = filterPeopleId ? people.find((p) => p._id === filterPeopleId) : null;

    const devPayouts = rows.filter((row) => {
      const k = payoutRowToKind(row);
      if (k !== "dev_payout") return false;
      const pid = refId(row.projectId);
      const peid = refId(row.peopleId) || refId(row.personId);
      if (filterProjectId && pid !== filterProjectId) return false;
      if (filterPeopleId && peid !== filterPeopleId) return false;
      return true;
    });

    const totalPaid = devPayouts.reduce((s, r) => s + (Number(r.amount) || 0), 0);

    const revenueForProject = filterProjectId
      ? revenues.reduce((s, row) => {
          const pid = typeof row.projectId === "string" ? row.projectId : row.projectId?._id;
          if (pid !== filterProjectId) return s;
          const st = row.status || "Received";
          if (st !== "Received") return s;
          const amt = Number(row.amount ?? row.totalAmount ?? 0) || 0;
          return s + Math.max(0, amt);
        }, 0)
      : 0;

    const projectCost = filterProjectId
      ? rows.reduce((s, row) => {
          const k = payoutRowToKind(row);
          if (k !== "dev_payout") return s;
          const pid = refId(row.projectId);
          if (pid !== filterProjectId) return s;
          const amt = Number(row.amount) || 0;
          return s + Math.max(0, amt);
        }, 0)
      : 0;

    const netLeft = filterProjectId ? revenueForProject - projectCost : 0;

    return {
      selectedProject,
      selectedPerson,
      totalPaid,
      revenueForProject,
      projectCost,
      netLeft,
      devPayoutCount: devPayouts.length,
    };
  }, [filterProjectId, filterPeopleId, projects, people, rows, revenues]);

  return (
    <div>
      <PageToolbar
        title={<PageHeader title="Payouts" className="mb-0" />}
        actions={
          <Button type="button" className="w-full sm:w-auto" onClick={openCreate}>
            Add new
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-[var(--purity-border)] bg-[var(--purity-card)] p-4 shadow-sm lg:grid-cols-12">
        <div className="lg:col-span-4">
          <FormField label="Filter by project">
            <Select value={filterProjectId} onChange={(e) => setFilterProjectId(e.target.value)}>
              <option value="">All projects</option>
              {[...projects]
                .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          </FormField>
        </div>
        <div className="lg:col-span-4">
          <FormField label="Filter by developer">
            <Select value={filterPeopleId} onChange={(e) => setFilterPeopleId(e.target.value)}>
              <option value="">All developers</option>
              {[...people]
                .sort((a, b) => (a.name || a.email || "").localeCompare(b.name || b.email || ""))
                .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name || p.email || p._id}
                  </option>
                ))}
            </Select>
          </FormField>
        </div>
        <div className="lg:col-span-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-lg border border-[var(--purity-border)] bg-[var(--purity-bg)] px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                Paid (dev payouts)
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums text-[var(--purity-text)]">
                {formatMoney(filteredSummary.totalPaid, "INR")}
              </div>
              <div className="mt-0.5 text-xs text-[var(--purity-muted)]">
                {filteredSummary.devPayoutCount} payout lines
              </div>
            </div>
            <div className="rounded-lg border border-[var(--purity-border)] bg-[var(--purity-bg)] px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                Project revenue (received)
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums text-[var(--purity-text)]">
                {filterProjectId ? formatMoney(filteredSummary.revenueForProject, "INR") : "—"}
              </div>
              <div className="mt-0.5 text-xs text-[var(--purity-muted)]">Select a project to compute</div>
            </div>
            <div className="rounded-lg border border-[var(--purity-border)] bg-[var(--purity-bg)] px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                Left with Rootkit (rev − cost)
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums text-[var(--purity-text)]">
                {filterProjectId ? formatMoney(filteredSummary.netLeft, "INR") : "—"}
              </div>
              <div className="mt-0.5 text-xs text-[var(--purity-muted)]">
                Cost uses dev payouts only
              </div>
            </div>
          </div>
        </div>
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

      <ResponsiveDataList
        table={
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
        }
        cards={
          <>
            {!loading && !error && rows.length === 0 ? (
              <div className="rounded-xl border border-[var(--purity-border)] bg-[var(--purity-card)] px-4 py-10 text-center text-sm text-[var(--purity-muted)]">
                No data
              </div>
            ) : null}
            {!loading &&
              rows.map((r) => (
                <div
                  key={r._id}
                  className="rounded-xl border border-[var(--purity-border)] bg-[var(--purity-card)] p-4 shadow-sm"
                >
                  <div className="text-lg font-semibold tabular-nums text-[var(--purity-text)]">
                    {formatMoney(Number(r.amount) || 0, r.currency || "INR")}
                  </div>
                  <div className="mt-1 text-sm text-[var(--purity-muted)]">{typeLabel(r)}</div>
                  {r.type === "subscription" && r.status ? (
                    <div className="text-xs text-[var(--purity-muted)]">{r.status}</div>
                  ) : null}
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-[var(--purity-muted)]">Related</dt>
                      <dd className="min-w-0 flex-1 break-words text-right text-xs text-[var(--purity-text)]">
                        {relatedLine(r)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--purity-muted)]">Date</dt>
                      <dd className="text-xs text-[var(--purity-text)]">
                        {formatDate(r.paymentDate || r.paidAt)}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-col gap-2 border-t border-[var(--purity-border)] pt-4">
                    <Button type="button" variant="secondary" className="w-full" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                    <Button type="button" variant="danger" className="w-full" onClick={() => onDelete(r._id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
          </>
        }
      />

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
          <FormField label="Kind" error={fieldErrors.kind}>
            <Select value={kind} onChange={(e) => setKind(e.target.value as PayoutKindValue)}>
              {PAYOUT_KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </FormField>

          {showProjectPerson ? (
            <>
              <FormField label="Project" error={fieldErrors.project}>
                <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Person" error={fieldErrors.person}>
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
          ) : null}

          <FormField label="Amount" error={fieldErrors.amount}>
            <FormattedNumberInput
              value={amount}
              onChange={setAmount}
              placeholder="e.g. 50000"
            />
          </FormField>
          <FormField label="Payment date">
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </FormField>
          <FormField label="Currency">
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} maxLength={8} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
