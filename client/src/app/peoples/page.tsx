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
import { Select } from "@/components/ui/Select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { PEOPLE_ROLE_OPTIONS } from "@/lib/formOptions";
import {
  validateContactTenDigits,
  validateEmail,
  validatePersonName,
  validateRole,
} from "@/lib/formValidation";
import { useToast } from "@/components/providers/ToastProvider";

type PeopleFormErrors = {
  name?: string;
  email?: string;
  contact?: string;
  role?: string;
};

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
  const [fieldErrors, setFieldErrors] = useState<PeopleFormErrors>({});

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
    setFieldErrors({});
    setModalOpen(true);
  }

  async function openEdit(p: PersonRow) {
    setEditingId(p._id);
    setModalOpen(true);
    setFieldErrors({});
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
      const c = (raw.contact || "").replace(/\D/g, "").slice(0, 10);
      setContact(c);
      setRole(raw.role || "");
      setProjectIds(
        (raw.assignedProjects || []).map((id) => String(id)).filter(Boolean)
      );
    } catch {
      setName(p.name || "");
      setEmail(p.email || "");
      setContact((p.contact || "").replace(/\D/g, "").slice(0, 10));
      setRole(p.role || "");
      setProjectIds([]);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setFieldErrors({});
  }

  function onContactChange(v: string) {
    setContact(v.replace(/\D/g, "").slice(0, 10));
  }

  function validatePeopleForm(): boolean {
    const next: PeopleFormErrors = {};
    const ne = validatePersonName(name);
    if (ne) next.name = ne;
    const ee = validateEmail(email);
    if (ee) next.email = ee;
    const ce = validateContactTenDigits(contact);
    if (ce) next.contact = ce;
    const re = validateRole(role);
    if (re) next.role = re;
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSave() {
    if (!validatePeopleForm()) return;
    setSaving(true);
    const body = {
      name: name.trim(),
      email: email.trim(),
      contact: contact.trim(),
      role: role.trim(),
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

  const projectOptions = projects.map((pr) => ({
    value: pr._id,
    label: pr.name,
  }));

  const roleOptions = [...PEOPLE_ROLE_OPTIONS];
  if (role && !roleOptions.includes(role as (typeof PEOPLE_ROLE_OPTIONS)[number])) {
    roleOptions.push(role as (typeof PEOPLE_ROLE_OPTIONS)[number]);
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
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Assigned projects</div>
          <div className="col-span-2 text-right">Actions</div>
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
              <div className="col-span-2 text-xs text-[var(--purity-muted)]">{p.role || "—"}</div>
              <div className="col-span-2 text-xs text-[var(--purity-muted)]">
                {resolveAssignedProjectNames(p.assignedProjects)}
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
          <FormField label="Name" error={fieldErrors.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </FormField>
          <FormField label="Email" error={fieldErrors.email}>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <FormField label="Contact" error={fieldErrors.contact}>
            <Input
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile"
              value={contact}
              onChange={(e) => onContactChange(e.target.value)}
            />
          </FormField>
          <FormField label="Role" error={fieldErrors.role}>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Select role</option>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Assigned projects">
            <MultiSelect
              options={projectOptions}
              value={projectIds}
              onChange={setProjectIds}
              disabled={!projectOptions.length}
            />
            <p className="text-xs text-[var(--purity-muted)]">Hold Ctrl or Cmd to select multiple.</p>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
