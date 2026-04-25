"use client";

import { useCallback, useEffect, useState } from "react";
import { API_PEOPLE, fetchJson } from "@/lib/fetchApi";
import { apiDelete, apiPost, apiPut, apiGet } from "@/lib/api";
import type { PersonRow, Project } from "@/types/api";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  EmptyState,
  ListPanel,
  listBodyRowClass,
  listHeadRowClass,
} from "@/components/layout/ListPanel";
import { Spinner } from "@/components/ui/Spinner";
import { resolveAssignedProjectNames } from "@/lib/relations";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/providers/ToastProvider";

export default function PeoplesPage() {
  const toast = useToast();
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState("");
  const [projectIds, setProjectIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    const [t, p] = await Promise.all([
      fetchJson<PersonRow[]>(API_PEOPLE),
      fetchJson<Project[]>("/projects"),
    ]);
    setPeople(Array.isArray(t) ? t : []);
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
          setError(e instanceof Error ? e.message : "Failed to load peoples");
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
    setEmail("");
    setContact("");
    setRole("");
    setProjectIds([]);
    setModalOpen(true);
  }

  async function openEdit(p: PersonRow) {
    setEditingId(p._id);
    setModalOpen(true);
    try {
      const raw = await apiGet<{
        name?: string;
        email?: string;
        contact?: string;
        role?: string;
        assignedProjects?: string[];
      }>(`${API_PEOPLE}/${p._id}`);
      setName(raw.name || "");
      setEmail(raw.email || "");
      setContact(raw.contact || "");
      setRole(raw.role || "");
      setProjectIds(
        (raw.assignedProjects || []).map((id) => String(id)).filter(Boolean)
      );
    } catch {
      setName(p.name || "");
      setEmail(p.email || "");
      setContact(p.contact || "");
      setRole(p.role || "");
      setProjectIds([]);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
  }

  async function onSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const body = {
      name: name.trim(),
      email: email.trim() || undefined,
      contact: contact.trim() || undefined,
      role: role.trim() || undefined,
      assignedProjects: projectIds,
    };
    try {
      if (editingId) {
        await apiPut(`${API_PEOPLE}/${editingId}`, body);
        toast.updated();
      } else {
        await apiPost(API_PEOPLE, body);
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
    if (!window.confirm("Delete this person?")) return;
    try {
      await apiDelete(`${API_PEOPLE}/${id}`);
      toast.deleted();
      await load();
    } catch {
      toast.error();
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Peoples" />
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
          <div className="col-span-2">Name</div>
          <div className="col-span-2">Email</div>
          <div className="col-span-2">Contact</div>
          <div className="col-span-3">Assigned projects</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>
        {!loading && !error && people.length === 0 ? (
          <EmptyState message="No data" />
        ) : null}
        {!loading &&
          people.map((p) => (
            <div key={p._id} className={`${listBodyRowClass()} grid-cols-12`}>
              <div className="col-span-2 font-semibold text-[var(--purity-text)]">{p.name || "—"}</div>
              <div className="col-span-2 text-[var(--purity-muted)]">{p.email || "—"}</div>
              <div className="col-span-2 text-[var(--purity-muted)]">{p.contact || "—"}</div>
              <div className="col-span-3 text-xs text-[var(--purity-muted)]">
                {resolveAssignedProjectNames(p.assignedProjects)}
              </div>
              <div className="col-span-3 flex justify-end gap-2">
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
        title={editingId ? "Edit person" : "New person"}
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
          <FormField label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <FormField label="Contact">
            <Input value={contact} onChange={(e) => setContact(e.target.value)} />
          </FormField>
          <FormField label="Role">
            <Input value={role} onChange={(e) => setRole(e.target.value)} />
          </FormField>
          <FormField label="Assigned projects (multi-select)">
            <select
              multiple
              className="min-h-[120px] w-full rounded-lg border border-[var(--purity-border)] bg-[var(--purity-card)] px-3 py-2 text-sm text-[var(--purity-text)] outline-none focus:ring-2 focus:ring-[var(--purity-accent)]/40"
              value={projectIds}
              onChange={(e) =>
                setProjectIds(Array.from(e.target.selectedOptions, (o) => o.value))
              }
            >
              {projects.map((pr) => (
                <option key={pr._id} value={pr._id}>
                  {pr.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
