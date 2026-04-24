"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchApi";
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
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("active");
  const [teamIds, setTeamIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    const [p, c, t] = await Promise.all([
      fetchJson<Project[]>("/projects"),
      fetchJson<Client[]>("/clients"),
      fetchJson<PersonRow[]>("/teams"),
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
    setClientId(clients[0]?._id || "");
    setBudget("");
    setStatus("active");
    setTeamIds([]);
    setModalOpen(true);
  }

  function openEdit(p: Project) {
    setEditingId(p._id);
    setName(p.name || "");
    setClientId(refId(p.clientId));
    setBudget(p.budget != null ? String(p.budget) : "");
    setStatus(p.status || "active");
    setTeamIds(teamMemberIds(p));
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
  }

  async function onSave() {
    if (!name.trim() || !clientId) {
      toast.error("Name and client are required");
      return;
    }
    setSaving(true);
    const body = {
      name: name.trim(),
      clientId,
      status: status.trim() || "active",
      budget: budget ? Number(budget) : undefined,
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
          <FormField label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label="Client">
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Budget">
            <Input
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Optional"
            />
          </FormField>
          <FormField label="Status">
            <Input value={status} onChange={(e) => setStatus(e.target.value)} />
          </FormField>
          <FormField label="Assigned team (multi-select)">
            <select
              multiple
              className="min-h-[120px] w-full rounded-lg border border-[var(--purity-border)] bg-[var(--purity-card)] px-3 py-2 text-sm text-[var(--purity-text)] outline-none focus:ring-2 focus:ring-[var(--purity-accent)]/40"
              value={teamIds}
              onChange={(e) =>
                setTeamIds(Array.from(e.target.selectedOptions, (o) => o.value))
              }
            >
              {people.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name || m.email || m._id}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
