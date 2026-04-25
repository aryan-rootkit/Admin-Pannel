"use client";

import { useCallback, useEffect, useState } from "react";
import { API_PEOPLE, fetchJson } from "@/lib/fetchApi";
import { apiDelete, apiPost, apiPut } from "@/lib/api";
import type { Client, PersonRow, Project } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  EmptyState,
  ListPanel,
  listBodyRowClass,
  listHeadRowClass,
} from "@/components/layout/ListPanel";
import { Spinner } from "@/components/ui/Spinner";
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
  validateBudgetPositive,
  validateClientId,
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
  budget?: string;
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
  const [budgetAmount, setBudgetAmount] = useState<number | undefined>(undefined);
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
    setBudgetAmount(undefined);
    setStatus(PROJECT_STATUS_OPTIONS[0]);
    setTeamIds([]);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(p: Project) {
    setEditingId(p._id);
    setName(p.name || "");
    setClientId(refId(p.clientId));
    const b = p.budget;
    setBudgetAmount(b != null && Number.isFinite(Number(b)) ? Number(b) : undefined);
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
    const be = validateBudgetPositive(budgetAmount);
    if (be) next.budget = be;
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
      budget: budgetAmount,
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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Projects" />
        <Button type="button" onClick={openCreate} disabled={!clients.length}>
          Add new
        </Button>
      </div>

      {!clients.length && !loading ? (
        <p className="mb-4 text-sm text-amber-800">
          Add a client first to create projects.
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

      <ListPanel>
        <div className={`${listHeadRowClass()} grid-cols-12`}>
          <div className="col-span-2">Project</div>
          <div className="col-span-2">Client</div>
          <div className="col-span-3">Team</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Budget</div>
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
                {p.budget != null ? formatMoney(p.budget) : "—"}
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
          <FormField label="Budget" error={fieldErrors.budget}>
            <FormattedNumberInput
              value={budgetAmount}
              onChange={setBudgetAmount}
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
            />
            <p className="text-xs text-[var(--purity-muted)]">Hold Ctrl or Cmd to select multiple.</p>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
