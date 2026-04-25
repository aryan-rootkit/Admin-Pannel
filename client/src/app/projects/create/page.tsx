"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { API_PEOPLE, fetchJson, getApiBase } from "@/lib/fetchApi";
import type { Client, PersonRow } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";
import { FormField } from "@/components/ui/FormField";
import { PROJECT_STATUS_OPTIONS } from "@/lib/formOptions";
import {
  validateClientId,
  validateContractValuePositive,
  validateProjectName,
} from "@/lib/formValidation";

type FieldErrors = { name?: string; client?: string; contract?: string };

export default function CreateProjectPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState<string>(PROJECT_STATUS_OPTIONS[0]);
  const [contractAmount, setContractAmount] = useState<number | undefined>(undefined);
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        getApiBase();
        const [c, p] = await Promise.all([
          fetchJson<Client[]>("/clients"),
          fetchJson<PersonRow[]>(API_PEOPLE),
        ]);
        if (cancelled) return;
        setClients(Array.isArray(c) ? c : []);
        setPeople(Array.isArray(p) ? p : []);
      } catch (e) {
        if (!cancelled)
          setLoadError(e instanceof Error ? e.message : "Failed to load form data");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    const ne = validateProjectName(name);
    if (ne) next.name = ne;
    const ce = validateClientId(clientId);
    if (ce) next.client = ce;
    const be = validateContractValuePositive(contractAmount);
    if (be) next.contract = be;
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setSaving(true);
    try {
      await apiPost("/projects", {
        name: name.trim(),
        clientId,
        status: status.trim(),
        totalValue: contractAmount,
        budget: contractAmount,
        assignedTeam: teamIds,
      });
      router.push("/projects");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  const peopleOptions = people.map((m) => ({
    value: m._id,
    label: m.name || m.email || m._id,
  }));

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Create project</h1>

      {clients.length === 0 && !loadError ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Create a client first (projects require a client).
        </div>
      ) : null}

      {loadError ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadError}</div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-3">
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
            {PROJECT_STATUS_OPTIONS.map((s) => (
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

        {submitError ? <div className="text-sm text-red-600">{submitError}</div> : null}

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
