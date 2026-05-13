"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_PEOPLE, fetchJson, getApiBase } from "@/lib/fetchApi";
import { apiDelete, apiGet, apiPut, ApiError } from "@/lib/api";
import type { Client, PersonRow, PayoutRow, Project, TeamMemberShare } from "@/types/api";
import { PAGE_SECTION_TITLE_CLASS, PAGE_TITLE_CLASS } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormattedNumberInput } from "@/components/ui/FormattedNumberInput";
import { PROJECT_STATUS_OPTIONS } from "@/lib/formOptions";
import {
  validateClientId,
  validateContractValuePositive,
  validateProjectName,
} from "@/lib/formValidation";
import { useToast } from "@/components/providers/ToastProvider";
import { formatMoney } from "@/lib/format";
import { resolveClientName } from "@/lib/relations";
import {
  allocatedFromPercent,
  consultancyPercent,
  sumSharePercents,
  validateTeamShares,
} from "@/lib/projectTeamShares";

function refId(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "_id" in v) return String((v as { _id: string })._id);
  return "";
}

function personName(people: PersonRow[], id: string, populated?: unknown): string {
  if (populated && typeof populated === "object" && "name" in populated) {
    const n = (populated as { name?: string }).name;
    if (n) return n;
  }
  return people.find((p) => p._id === id)?.name || id.slice(0, 8);
}

function paidOnProject(payouts: PayoutRow[], personId: string, projectId: string): number {
  let s = 0;
  for (const row of payouts) {
    if (row.type === "subscription") continue;
    const pid = refId(row.peopleId) || refId(row.personId);
    if (pid !== personId) continue;
    if (refId(row.projectId) !== projectId) continue;
    s += Number(row.amount) || 0;
  }
  return s;
}

function sharesFromProject(p: Project): TeamMemberShare[] {
  const raw = p.teamMemberShares;
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => ({
    peopleId: refId(row.peopleId),
    sharePercent: Math.min(100, Math.max(0, Number(row.sharePercent) || 0)),
  }));
}

type ProjectFormErrors = {
  name?: string;
  client?: string;
  contract?: string;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = typeof params.id === "string" ? params.id : "";

  const [project, setProject] = useState<Project | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [contractAmount, setContractAmount] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<string>(PROJECT_STATUS_OPTIONS[0]);
  const [shares, setShares] = useState<TeamMemberShare[]>([]);
  const [addPersonId, setAddPersonId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ProjectFormErrors>({});

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      getApiBase();
      const [pr, c, t, po] = await Promise.all([
        apiGet<Project>(`/projects/${id}`),
        fetchJson<Client[]>("/clients"),
        fetchJson<PersonRow[]>(API_PEOPLE),
        fetchJson<PayoutRow[]>("/payouts"),
      ]);
      setProject(pr);
      setName(pr.name || "");
      setClientId(refId(pr.clientId));
      const v = pr.totalValue ?? pr.budget;
      setContractAmount(v != null && Number.isFinite(Number(v)) ? Number(v) : undefined);
      setStatus(pr.status && pr.status.trim() ? pr.status : PROJECT_STATUS_OPTIONS[0]);
      setShares(sharesFromProject(pr));
      setClients(Array.isArray(c) ? c : []);
      setPeople(Array.isArray(t) ? t : []);
      setPayouts(Array.isArray(po) ? po : []);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setError("Project not found.");
      } else {
        setError(e instanceof Error ? e.message : "Failed to load project");
      }
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const contract = useMemo(
    () => Math.max(0, Number(contractAmount ?? project?.totalValue ?? project?.budget ?? 0) || 0),
    [contractAmount, project]
  );

  const shareRows = useMemo(() => {
    if (!project) return [];
    return shares.map((s) => {
      const pid = refId(s.peopleId);
      const populated = project.teamMemberShares?.find((x) => refId(x.peopleId) === pid)?.peopleId;
      const pct = Math.min(100, Math.max(0, Number(s.sharePercent) || 0));
      const allocated = allocatedFromPercent(contract, pct);
      const paid = paidOnProject(payouts, pid, id);
      return {
        peopleId: pid,
        displayName: personName(people, pid, populated),
        sharePercent: pct,
        allocated,
        paid,
        pending: Math.max(0, allocated - paid),
      };
    });
  }, [shares, contract, payouts, id, people, project]);

  const consultancyPct = useMemo(() => consultancyPercent(shares), [shares]);
  const consultancyAmount = useMemo(
    () => allocatedFromPercent(contract, consultancyPct),
    [contract, consultancyPct]
  );

  const peopleInShares = useMemo(() => new Set(shares.map((s) => refId(s.peopleId))), [shares]);
  const addablePeople = useMemo(
    () => people.filter((p) => !peopleInShares.has(p._id)),
    [people, peopleInShares]
  );

  function updateSharePercent(peopleId: string, pct: number) {
    setShares((prev) => {
      const next = prev.map((r) => (refId(r.peopleId) === peopleId ? { ...r, sharePercent: pct } : r));
      setShareError(validateTeamShares(next));
      return next;
    });
  }

  function removeShareRow(peopleId: string) {
    setShares((prev) => {
      const next = prev.filter((r) => refId(r.peopleId) !== peopleId);
      setShareError(validateTeamShares(next));
      return next;
    });
  }

  function addShareRow() {
    if (!addPersonId) return;
    if (peopleInShares.has(addPersonId)) return;
    setShares((prev) => {
      const next = [...prev, { peopleId: addPersonId, sharePercent: 0 }];
      setShareError(validateTeamShares(next));
      return next;
    });
    setAddPersonId("");
  }

  function validateForm(): boolean {
    const next: ProjectFormErrors = {};
    const ne = validateProjectName(name);
    if (ne) next.name = ne;
    const ce = validateClientId(clientId);
    if (ce) next.client = ce;
    const be = validateContractValuePositive(contractAmount);
    if (be) next.contract = be;
    setFieldErrors(next);
    const se = validateTeamShares(shares);
    setShareError(se);
    return Object.keys(next).length === 0 && !se;
  }

  async function onSave() {
    if (!id || !validateForm()) return;
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        clientId,
        status: status.trim(),
        totalValue: contractAmount,
        budget: contractAmount,
        teamMemberShares: shares.map((s) => ({
          peopleId: refId(s.peopleId),
          sharePercent: Math.min(100, Math.max(0, Number(s.sharePercent) || 0)),
        })),
      };
      const updated = await apiPut<Project>(`/projects/${id}`, body);
      setProject(updated);
      setShares(sharesFromProject(updated));
      toast.updated();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Save failed";
      toast.error();
      setShareError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!id) return;
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    try {
      await apiDelete(`/projects/${id}`);
      toast.deleted();
      router.push("/projects");
    } catch {
      toast.error();
    }
  }

  const statusOptions = [...PROJECT_STATUS_OPTIONS];
  if (status && !statusOptions.includes(status as (typeof PROJECT_STATUS_OPTIONS)[number])) {
    statusOptions.push(status as (typeof PROJECT_STATUS_OPTIONS)[number]);
  }

  if (!id) {
    return <p className="text-sm text-slate-600">Invalid link.</p>;
  }

  return (
    <div className="min-w-0 pb-10">
      <Link
        href="/projects"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
      >
        <span
          aria-hidden
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
        >
          ←
        </span>
        Back to Projects
      </Link>

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          <div className="h-10 w-2/3 max-w-md animate-pulse rounded-xl bg-slate-200" />
          <div className="h-48 animate-pulse rounded-[20px] bg-slate-100" />
          <div className="h-64 animate-pulse rounded-[20px] bg-slate-100" />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
      ) : null}

      {!loading && !error && project ? (
        <>
          <header className="mb-8">
            <h1 className={PAGE_TITLE_CLASS}>{project.name}</h1>
            <p className="mt-1 text-base text-slate-500">{resolveClientName(project.clientId)}</p>
          </header>

          <div className="space-y-6">
            <div className="rounded-[20px] border border-slate-200/90 bg-white p-6 shadow-[var(--rk-shadow-card)] md:p-8">
              <h2 className={`mb-6 ${PAGE_SECTION_TITLE_CLASS}`}>Project details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Name" error={fieldErrors.name} className="md:col-span-2">
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
                <FormField label="Status">
                  <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Contract value (total)" error={fieldErrors.contract} className="md:col-span-2">
                  <FormattedNumberInput
                    value={contractAmount}
                    onChange={setContractAmount}
                    placeholder="e.g. 50000"
                  />
                </FormField>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-500">
                Set each member&apos;s share as a percentage of the contract. The remainder stays with Rootkit Consultancy.
                Pending per person is their allocation minus payouts recorded for this project.
              </p>
            </div>

            <div className="rounded-[20px] border border-slate-200/90 bg-white p-6 shadow-[var(--rk-shadow-card)] md:p-8">
              <h2 className={`mb-2 ${PAGE_SECTION_TITLE_CLASS}`}>Team contract split</h2>
              <p className="mb-6 text-sm text-slate-500">
                Sum of member percentages must not exceed 100%. Currently:{" "}
                <span className="font-semibold tabular-nums text-slate-800">{sumSharePercents(shares).toFixed(1)}%</span>
                {" · "}
                Consultancy:{" "}
                <span className="font-semibold tabular-nums text-slate-800">{consultancyPct.toFixed(1)}%</span> (
                {formatMoney(consultancyAmount)})
              </p>

              {shareError ? (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  {shareError}
                </div>
              ) : null}

              {!shareRows.length ? (
                <p className="mb-4 text-sm text-slate-500">No team members in the split yet. Add people below.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Member</th>
                        <th className="px-4 py-3">% of contract</th>
                        <th className="px-4 py-3 text-right">Allocated</th>
                        <th className="px-4 py-3 text-right">Paid</th>
                        <th className="px-4 py-3 text-right">Pending</th>
                        <th className="px-4 py-3 w-24" />
                      </tr>
                    </thead>
                    <tbody>
                      {shareRows.map((row) => (
                        <tr key={row.peopleId} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-900">{row.displayName}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.1}
                                className="max-w-[6rem]"
                                value={Number.isFinite(row.sharePercent) ? row.sharePercent : 0}
                                onChange={(e) =>
                                  updateSharePercent(row.peopleId, Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                                }
                              />
                              <span className="text-slate-500">%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-800">{formatMoney(row.allocated)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-emerald-800">{formatMoney(row.paid)}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-semibold text-rose-800">
                            {formatMoney(row.pending)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="text-xs font-semibold text-rose-600 hover:underline"
                              onClick={() => removeShareRow(row.peopleId)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-end gap-3">
                <FormField label="Add member to split" className="min-w-[200px] flex-1">
                  <Select value={addPersonId} onChange={(e) => setAddPersonId(e.target.value)}>
                    <option value="">Select person</option>
                    {addablePeople.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name || p.email || p._id}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <Button type="button" variant="secondary" onClick={addShareRow} disabled={!addPersonId}>
                  Add
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <Button type="button" variant="danger" onClick={onDelete}>
                Delete project
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => void load()}>
                  Reset
                </Button>
                <Button type="button" onClick={() => void onSave()} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
