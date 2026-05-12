"use client";

import { useCallback, useEffect, useState } from "react";
import { API_PEOPLE, fetchJson } from "@/lib/fetchApi";
import { apiDelete, apiPost, apiPut } from "@/lib/api";
import type { Client, PersonRow, Project } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { ResponsiveDataList } from "@/components/layout/ResponsiveDataList";
import {
  EmptyState,
  ListPanel,
  listBodyRowClass,
  listHeadRowClass,
} from "@/components/layout/ListPanel";
import { ListPageSkeleton } from "@/components/layout/ListPageSkeleton";
import { formatMoney } from "@/lib/format";
import { resolveAssignedTeamNames, resolveClientName } from "@/lib/relations";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";
import { PROJECT_STATUS_OPTIONS } from "@/lib/formOptions";
import {
  validateClientId,
  validateContractValuePositive,
  validateProjectName,
} from "@/lib/formValidation";
import { useToast } from "@/components/providers/ToastProvider";

function refId(v: string | { _id: string } | undefined | null): string {
  if (v == null) return "";
  return typeof v === "string" ? v : v._id;
}

function teamMemberIds(p: Project): string[] {
  const team = p.assignedTeam || [];
  return team
    .map((m) => {
      if (typeof m === "string") return m;
      if (m && typeof m === "object" && "_id" in m) return String((m as { _id: string })._id);
      return "";
    })
    .filter(Boolean);
}

type ProjectFormErrors = {
  name?: string;
  client?: string;
  contract?: string;
};

export default function ProjectsPage() {
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [contractAmount, setContractAmount] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<string>(PROJECT_STATUS_OPTIONS[0]);
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<ProjectFormErrors>({});

  const load = useCallback(async () => {
    const [p, c, t] = await Promise.all([
      fetchJson<Project[]>("/projects"),
      fetchJson<Client[]>("/clients"),
      fetchJson<PersonRow[]>(API_PEOPLE),
    ]);
    setProjects(Array.isArray(p) ? p : []);
    setClients(Array.isArray(c) ? c : []);
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
          setError(e instanceof Error ? e.message : "Failed to load projects");
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
    setName("");
    setClientId("");
    setContractAmount(undefined);
    setStatus(PROJECT_STATUS_OPTIONS[0]);
    setTeamIds([]);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(p: Project) {
    setEditingId(p._id);
    setName(p.name || "");
    setClientId(refId(p.clientId));
    const v = p.totalValue ?? p.budget;
    setContractAmount(v != null && Number.isFinite(Number(v)) ? Number(v) : undefined);
    setStatus(p.status && p.status.trim() ? p.status : PROJECT_STATUS_OPTIONS[0]);
    setTeamIds(teamMemberIds(p));
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFieldErrors({});
  }

  function validateProjectForm(): boolean {
    const next: ProjectFormErrors = {};
    const ne = validateProjectName(name);
    if (ne) next.name = ne;
    const ce = validateClientId(clientId);
    if (ce) next.client = ce;
    const be = validateContractValuePositive(contractAmount);
    if (be) next.contract = be;
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSave() {
    if (!validateProjectForm()) return;
    setSaving(true);
    const body = {
      name: name.trim(),
      clientId,
      status: status.trim(),
      totalValue: contractAmount,
      budget: contractAmount,
      assignedTeam: teamIds,
    };
    try {
      if (editingId) {
        await apiPut(`/projects/${editingId}`, body);
        toast.updated();
      } else {
        await apiPost("/projects", body);
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
    if (!window.confirm("Delete this project?")) return;
    try {
      await apiDelete(`/projects/${id}`);
      toast.deleted();
      await load();
    } catch {
      toast.error();
    }
  }

  const peopleOptions = people.map((m) => ({
    value: m._id,
    label: m.name || m.email || m._id,
  }));

  const statusOptions = [...PROJECT_STATUS_OPTIONS];
  if (status && !statusOptions.includes(status as (typeof PROJECT_STATUS_OPTIONS)[number])) {
    statusOptions.push(status as (typeof PROJECT_STATUS_OPTIONS)[number]);
  }

  return (
    <div>
      <PageToolbar
        title={<PageHeader title="Projects" className="mb-0" />}
        actions={
          <Button type="button" className="w-full sm:w-auto" onClick={openCreate} disabled={!clients.length}>
            Add new
          </Button>
        }
      />

      {!clients.length && !loading ? (
        <p className="mb-4 text-sm text-amber-800">
          Add a client first to create projects.
        </p>
      ) : null}

      {loading ? <ListPageSkeleton rows={8} /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <ResponsiveDataList
        table={
          <ListPanel>
            <div className={`${listHeadRowClass()} grid-cols-12`}>
              <div className="col-span-2">Project</div>
              <div className="col-span-2">Client</div>
              <div className="col-span-3">Team</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Contract</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {!loading && !error && projects.length === 0 ? (
              <EmptyState message="No data" />
            ) : null}
            {!loading &&
              projects.map((p) => (
                <div key={p._id} className={`${listBodyRowClass()} grid-cols-12`}>
                  <div className="col-span-2 font-semibold text-[var(--purity-text)]">{p.name}</div>
                  <div className="col-span-2 text-[var(--purity-muted)]">{resolveClientName(p.clientId)}</div>
                  <div className="col-span-3 text-xs text-[var(--purity-muted)]">
                    {resolveAssignedTeamNames(p.assignedTeam)}
                  </div>
                  <div className="col-span-2">
                    <span className="inline-block rounded-full bg-[var(--purity-sidebar-active)] px-2 py-0.5 text-xs font-semibold text-[var(--purity-accent-hover)]">
                      {p.status || "—"}
                    </span>
                  </div>
                  <div className="col-span-1 text-right text-sm font-semibold text-[var(--purity-text)]">
                    {p.totalValue != null || p.budget != null
                      ? formatMoney(Number(p.totalValue ?? p.budget ?? 0))
                      : "—"}
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      type="button"
                      className="text-xs font-bold uppercase tracking-wide text-[var(--purity-accent-hover)] hover:underline"
                      onClick={() => openEdit(p)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-xs font-bold uppercase tracking-wide text-red-600 hover:underline"
                      onClick={() => onDelete(p._id)}
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
            {!loading && !error && projects.length === 0 ? (
              <div className="rounded-xl border border-[var(--purity-border)] bg-[var(--purity-card)] px-4 py-10 text-center text-sm text-[var(--purity-muted)]">
                No data
              </div>
            ) : null}
            {!loading &&
              projects.map((p) => (
                <div
                  key={p._id}
                  className="rounded-xl border border-[var(--purity-border)] bg-[var(--purity-card)] p-4 shadow-sm"
                >
                  <div className="text-base font-semibold text-[var(--purity-text)]">{p.name}</div>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-[var(--purity-muted)]">Client</dt>
                      <dd className="min-w-0 flex-1 text-right text-[var(--purity-text)]">
                        {resolveClientName(p.clientId)}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-[var(--purity-muted)]">Team</dt>
                      <dd className="min-w-0 flex-1 break-words text-right text-xs text-[var(--purity-text)]">
                        {resolveAssignedTeamNames(p.assignedTeam)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-[var(--purity-muted)]">Status</dt>
                      <dd>
                        <span className="inline-block rounded-full bg-[var(--purity-sidebar-active)] px-2 py-0.5 text-xs font-semibold text-[var(--purity-accent-hover)]">
                          {p.status || "—"}
                        </span>
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[var(--purity-muted)]">Contract</dt>
                      <dd className="font-semibold tabular-nums text-[var(--purity-text)]">
                        {p.totalValue != null || p.budget != null
                          ? formatMoney(Number(p.totalValue ?? p.budget ?? 0))
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-col gap-2 border-t border-[var(--purity-border)] pt-4">
                    <Button type="button" variant="secondary" className="w-full" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                    <Button type="button" variant="danger" className="w-full" onClick={() => onDelete(p._id)}>
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
        title={editingId ? "Edit project" : "New project"}
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
          <FormField label="Name" error={fieldErrors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </FormField>
          <FormField label="Client" error={fieldErrors.client}>
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Contract value (total)" error={fieldErrors.contract}>
            <FormattedNumberInput
              value={contractAmount}
              onChange={setContractAmount}
              placeholder="e.g. 100000"
            />
          </FormField>
          <FormField label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Assigned team">
            <MultiSelect
              options={peopleOptions}
              value={teamIds}
              onChange={setTeamIds}
              disabled={!peopleOptions.length}
              placeholder="Search people…"
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
