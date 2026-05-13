"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApiError, apiGet, apiPut } from "@/lib/api";
import type { Client } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { PAGE_TITLE_CLASS } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/Input";

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<Client>(`/clients/${id}`)
      .then((data) => {
        console.log("[clients/:id] received:", data?._id, data?.name);
        setClient(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: client.name.trim(),
        email: (client.email || "").trim() || undefined,
        contact: (client.contact ?? client.phone ?? "").trim() || undefined,
        notes: (client.notes || "").trim() || undefined,
      };
      await apiPut(`/clients/${id}`, payload);
      router.push("/clients");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!client) return <div>Loading…</div>;

  return (
    <div className="mx-auto w-full max-w-xl min-w-0 space-y-4">
      <h1 className={PAGE_TITLE_CLASS}>Edit client</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <div className="text-sm font-medium">Name</div>
          <Input
            value={client.name}
            onChange={(e) => setClient({ ...client, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">Email</div>
          <Input
            value={client.email || ""}
            onChange={(e) => setClient({ ...client, email: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">Contact</div>
          <Input
            value={client.contact ?? client.phone ?? ""}
            onChange={(e) =>
              setClient({ ...client, contact: e.target.value, phone: e.target.value })
            }
          />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">Notes</div>
          <Input
            value={client.notes || ""}
            onChange={(e) => setClient({ ...client, notes: e.target.value })}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

