"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import type { Client } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export default function CreateProjectPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("active");
  const [budget, setBudget] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<Client[]>("/clients")
      .then((data) => {
        console.log("[projects/create] clients received:", data.length);
        setClients(data);
        if (!clientId && data[0]?._id) setClientId(data[0]._id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load clients"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiPost("/projects", {
        name,
        clientId,
        status,
        budget: budget ? Number(budget) : undefined,
      });
      router.push("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Create project</h1>

      {clients.length === 0 ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Create a client first (Projects require `clientId`).
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <div className="text-sm font-medium">Name</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Client</div>
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Status</div>
          <Input value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Budget</div>
          <Input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            inputMode="numeric"
            placeholder="5000"
          />
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving || clients.length === 0}>
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

