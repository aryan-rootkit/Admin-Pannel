"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_PEOPLE, fetchJson, getApiBase } from "@/lib/fetchApi";
import { apiDelete, apiPost, apiPut, apiGet } from "@/lib/api";
import type { PayoutRow, PersonRow, Project } from "@/types/api";
import { PeopleCard } from "@/components/peoples/PeopleCard";
import { PeoplesGridSkeleton } from "@/components/peoples/PeoplesGridSkeleton";
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
import { totalPayoutsForPerson } from "@/lib/personFinance";
import { PAGE_TITLE_CLASS } from "@/components/layout/PageHeader";
import { buildProjectStatusMap, sortPeopleForList } from "@/lib/peopleSort";

type PeopleFormErrors = {
  name?: string;
  email?: string;
  contact?: string;
  role?: string;
};

function formatListAmount(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function assignedProjectCount(p: PersonRow) {
  const a = p.assignedProjects;
  return Array.isArray(a) ? a.length : 0;
}

export default function PeoplesPage() {
  const toast = useToast();
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
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
    const [t, p, po] = await Promise.all([
      fetchJson<PersonRow[]>(API_PEOPLE),
      fetchJson<Project[]>("/projects"),
      fetchJson<PayoutRow[]>("/payouts"),
    ]);
    setPeople(Array.isArray(t) ? t : []);
    setProjects(Array.isArray(p) ? p : []);
    setPayouts(Array.isArray(po) ? po : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        getApiBase();
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

  const payoutTotals = useMemo(() => {
    const m = new Map<string, number>();
    for (const person of people) {
      m.set(person._id, totalPayoutsForPerson(payouts, person._id));
    }
    return m;
  }, [people, payouts]);

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

  async function handleDeletePerson(id: string) {
    if (!window.confirm("Delete this person?")) return;
    try {
      await apiDelete(`${API_PEOPLE}/${id}`);
      toast.deleted();
      await load();
      closeModal();
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

  const projectStatusById = useMemo(() => buildProjectStatusMap(projects), [projects]);
  const sortedPeople = useMemo(
    () => sortPeopleForList(people, projectStatusById),
    [people, projectStatusById]
  );

  return (
    <div className="min-w-0">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={PAGE_TITLE_CLASS}>Peoples</h1>
        </div>
        <Button type="button" className="rounded-full px-6 font-semibold shadow-sm" onClick={openCreate}>
          Add new
        </Button>
      </div>

      {loading ? <PeoplesGridSkeleton cards={10} /> : null}
      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && people.length === 0 ? (
        <div className="rounded-[20px] border border-slate-200/90 bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-sm">
          No people yet — add your first team member.
        </div>
      ) : null}

      {!loading && !error && people.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {sortedPeople.map((p) => (
            <PeopleCard
              key={p._id}
              id={p._id}
              name={p.name || "—"}
              title={p.role || p.subRole || "—"}
              avatarUrl={p.avatar}
              revenueDisplay={formatListAmount(payoutTotals.get(p._id) ?? 0)}
              projectCount={assignedProjectCount(p)}
              onEdit={() => openEdit(p)}
            />
          ))}
        </div>
      ) : null}

      <Modal
        open={modalOpen}
        title={editingId ? "Edit person" : "New person"}
        onClose={closeModal}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => editingId && handleDeletePerson(editingId)}
              >
                Delete
              </Button>
            ) : null}
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
              placeholder="Search projects…"
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
