"use client";

import { useCallback, useEffect, useState } from "react";
import { API_PEOPLE, fetchJson, getApiBase } from "@/lib/fetchApi";
import { apiPost, apiPut } from "@/lib/api";
import type { Client, PersonRow, Project } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { PAGE_TITLE_CLASS } from "@/components/layout/PageHeader";
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
import { resolveAssignedTeamNames, resolveClientName } from "@/lib/relations";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectsGridSkeleton } from "@/components/projects/ProjectsGridSkeleton";

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

function formatListAmount(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
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
        getApiBase();
        await load();
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load projects");
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

  const peopleOptions = people.map((m) => ({
    value: m._id,
    label: m.name || m.email || m._id,
  }));

  const statusOptions = [...PROJECT_STATUS_OPTIONS];
  if (status && !statusOptions.includes(status as (typeof PROJECT_STATUS_OPTIONS)[number])) {
    statusOptions.push(status as (typeof PROJECT_STATUS_OPTIONS)[number]);
  }

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={PAGE_TITLE_CLASS}>Projects</h1>
        </div>
        <Button
          type="button"
          className="rounded-full px-6 font-semibold shadow-sm"
          onClick={openCreate}
          disabled={!clients.length}
        >
          Add new
        </Button>
      </div>

      {!clients.length && !loading ? (
        <p className="mb-4 text-sm text-amber-800">Add a client first to create projects.</p>
      ) : null}

      {loading ? <ProjectsGridSkeleton cards={10} /> : null}
      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {!loading && !error && projects.length === 0 ? (
        <div className="rounded-[20px] border border-slate-200/90 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm">
          No projects yet — create one to assign team and contract splits on the detail page.
        </div>
      ) : null}

      {!loading && !error && projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {projects.map((p) => {
            const contractNum = Number(p.totalValue ?? p.budget ?? 0);
            const contractDisplay =
              p.totalValue != null || p.budget != null ? `₹ ${formatListAmount(contractNum)}` : "—";
            const teamLine = resolveAssignedTeamNames(p.assignedTeam);
            return (
              <ProjectCard
                key={p._id}
                id={p._id}
                name={p.name || "—"}
                clientLabel={resolveClientName(p.clientId)}
                statusLabel={p.status || "—"}
                contractDisplay={contractDisplay}
                teamPreview={teamLine}
                onEdit={() => openEdit(p)}
              />
            );
          })}
        </div>
      ) : null}

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
          <p className="text-xs leading-relaxed text-slate-500">
            Contract percentages and payout math are configured on the project detail page (More details).
          </p>
        </div>
      </Modal>
    </div>
  );
}
