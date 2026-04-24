"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function CreateClientPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: name.trim(),
      email: email.trim() || undefined,
      contact: contact.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    try {
      console.log("[clients/create] POST /api/clients", payload);
      await apiPost("/clients", payload);
      router.push("/clients");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create client");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Create client</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <div className="text-sm font-medium">Name</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">Email</div>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">Contact</div>
          <Input value={contact} onChange={(e) => setContact(e.target.value)} />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">Notes</div>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Create"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

