"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchApi";
import { ApiError, apiDelete, apiPost, apiPut } from "@/lib/api";
import type { Client } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  EmptyState,
  ListPanel,
  listBodyRowClass,
  listHeadRowClass,
} from "@/components/layout/ListPanel";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/providers/ToastProvider";

export default function ClientsPage() {
  const toast = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    const data = await fetchJson<Client[]>("/clients");
    setClients(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load clients");
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
    setNotes("");
    setModalOpen(true);
  }

  function openEdit(c: Client) {
    setEditingId(c._id);
    setName(c.name || "");
    setEmail(c.email || "");
    setContact(c.contact || c.phone || "");
    setNotes(c.notes || "");
    setModalOpen(true);
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
    const payload = {
      name: name.trim(),
      email: email.trim() || undefined,
      contact: contact.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    try {
      if (editingId) {
        console.log("[clients] PUT /clients/:id payload:", editingId, payload);
        await apiPut(`/clients/${editingId}`, payload);
        toast.updated();
      } else {
        console.log("[clients] POST /api/clients payload:", payload);
        await apiPost("/clients", payload);
        toast.saved();
      }
      await load();
      closeModal();
    } catch (e) {
      console.error("[clients] save failed:", e);
      toast.error(e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Delete this client?")) return;
    try {
      await apiDelete(`/clients/${id}`);
      toast.deleted();
      await load();
    } catch {
      toast.error();
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Clients" />
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
          <div className="col-span-4">Name</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Contact</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>
        {!loading && !error && clients.length === 0 ? (
          <EmptyState message="No data" />
        ) : null}
        {!loading &&
          clients.map((c) => (
            <div key={c._id} className={`${listBodyRowClass()} grid-cols-12`}>
              <div className="col-span-4 font-semibold text-[var(--purity-text)]">{c.name}</div>
              <div className="col-span-3 text-[var(--purity-muted)]">{c.email || "—"}</div>
              <div className="col-span-2 text-[var(--purity-muted)]">{c.contact || c.phone || "—"}</div>
              <div className="col-span-3 flex justify-end gap-2">
                <button
                  type="button"
                  className="text-xs font-bold uppercase tracking-wide text-[var(--purity-accent-hover)] hover:underline"
                  onClick={() => openEdit(c)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs font-bold uppercase tracking-wide text-red-600 hover:underline"
                  onClick={() => onDelete(c._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </ListPanel>

      <Modal
        open={modalOpen}
        title={editingId ? "Edit client" : "New client"}
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
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>
          <FormField label="Contact">
            <Input value={contact} onChange={(e) => setContact(e.target.value)} />
          </FormField>
          <FormField label="Notes">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
