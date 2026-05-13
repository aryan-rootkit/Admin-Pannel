"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_PEOPLE, fetchJson, getApiBase } from "@/lib/fetchApi";
import { apiGet, ApiError } from "@/lib/api";
import type { PersonRow, PayoutRow, RevenueRow } from "@/types/api";
import {
  buildPersonProjectMoneyRows,
  filterProjectsTab,
  type PersonProjectMoneyRow,
} from "@/lib/personFinance";
import { PersonDetailSkeleton } from "@/components/peoples/PersonDetailSkeleton";
import { PAGE_SECTION_TITLE_CLASS, PAGE_TITLE_CLASS } from "@/components/layout/PageHeader";

function fmt(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function defaultBio(p: PersonRow): string {
  if (p.bio?.trim()) return p.bio.trim();
  const role = p.role || "team member";
  const n = p.name || "They";
  return `${n} is a ${role}, partnering with stakeholders to deliver dependable outcomes across assigned projects — balancing velocity with clarity and ownership.`;
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className={`mb-4 ${PAGE_SECTION_TITLE_CLASS}`}>{title}</h2>;
}

function MoneyBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "sky" | "rose";
}) {
  const styles =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-900 ring-emerald-100"
      : tone === "sky"
        ? "bg-sky-50 text-sky-900 ring-sky-100"
        : "bg-rose-50 text-rose-900 ring-rose-100";
  return (
    <div className={`rounded-xl px-3 py-2 text-center ring-1 ring-inset ${styles}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{fmt(value)}</p>
    </div>
  );
}

function ProjectRow({ row }: { row: PersonProjectMoneyRow }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 py-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{row.projectName}</p>
        <p className="mt-0.5 text-sm text-slate-500">{row.clientLabel}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <MoneyBadge label="Payout" value={row.payout} tone="emerald" />
        <MoneyBadge label="Advance" value={row.advance} tone="sky" />
        <MoneyBadge label="Pending" value={row.pending} tone="rose" />
        <Link
          href={`/revenues?project=${encodeURIComponent(row.projectId)}`}
          className="ml-1 shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[var(--purity-accent)] shadow-sm transition hover:bg-slate-50"
        >
          Edit payments
        </Link>
        <Link
          href="/projects"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          aria-label={`Open projects · ${row.projectName}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M7 17 17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default function PersonDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [person, setPerson] = useState<PersonRow | null>(null);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [revenues, setRevenues] = useState<RevenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "coding">("all");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      getApiBase();
      const [p, po, rev] = await Promise.all([
        apiGet<PersonRow>(`${API_PEOPLE}/${id}`),
        fetchJson<PayoutRow[]>("/payouts"),
        fetchJson<RevenueRow[]>("/revenues"),
      ]);
      setPerson(p);
      setPayouts(Array.isArray(po) ? po : []);
      setRevenues(Array.isArray(rev) ? rev : []);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setError("Person not found.");
      } else {
        setError(e instanceof Error ? e.message : "Failed to load profile");
      }
      setPerson(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const projectRows = useMemo(() => {
    if (!person) return [];
    return buildPersonProjectMoneyRows(person._id, person.assignedProjects, payouts, revenues);
  }, [person, payouts, revenues]);

  const filteredRows = useMemo(() => filterProjectsTab(projectRows, tab), [projectRows, tab]);

  const skills = useMemo(() => {
    if (!person) return [];
    if (person.skills?.length) return person.skills;
    const s = [person.role, person.subRole].filter(Boolean) as string[];
    return s.length ? s : ["General"];
  }, [person]);

  const photoInitials = useMemo(() => {
    const n = person?.name || "?";
    return n
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");
  }, [person]);

  if (!id) {
    return <p className="text-sm text-slate-600">Invalid link.</p>;
  }

  return (
    <div className="min-w-0 pb-8">
      <Link
        href="/peoples"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
      >
        <span aria-hidden className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">
          ←
        </span>
        Back to Peoples
      </Link>

      {loading ? <PersonDetailSkeleton /> : null}

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
      ) : null}

      {!loading && !error && person ? (
        <>
          <header className="mb-8">
            <h1 className={PAGE_TITLE_CLASS}>{person.name}</h1>
            <p className="mt-1 text-base text-slate-500">{person.role || person.subRole || "Team member"}</p>
          </header>

          <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <aside className="space-y-6 lg:col-span-4">
            <div className="overflow-hidden rounded-[20px] border border-slate-200/90 bg-white shadow-[var(--rk-shadow-card)]">
              <div className="relative aspect-square bg-slate-100">
                {person.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={person.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-slate-300">
                    {photoInitials}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[20px] border border-slate-200/90 bg-white p-6 shadow-[var(--rk-shadow-card)]">
              <SectionHeading title="My Skills" />
              <div className="flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <span
                    key={`${s}-${i}`}
                    className="rounded-full border border-slate-900/15 px-4 py-2 text-sm font-medium text-slate-900"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-slate-200/90 bg-white p-6 shadow-[var(--rk-shadow-card)]">
              <SectionHeading title="Contact" />
              <div className="space-y-3">
                <div className="rounded-full border border-slate-900/15 px-4 py-3 text-sm text-slate-900">
                  {person.email || "—"}
                </div>
                <div className="rounded-full border border-slate-900/15 px-4 py-3 text-sm text-slate-900">
                  {person.contact || "—"}
                </div>
                <div className="rounded-full border border-slate-900/15 px-4 py-3 text-sm text-slate-900">
                  {person.location?.trim() || "Location not set"}
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-[20px] border border-slate-200/90 bg-white p-6 md:p-8 shadow-[var(--rk-shadow-card)]">
              <h2 className={`mb-4 ${PAGE_SECTION_TITLE_CLASS}`}>About</h2>
              <div className="space-y-4 text-sm leading-relaxed text-slate-600">
                {defaultBio(person)
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-slate-200/90 bg-white p-6 shadow-[var(--rk-shadow-card)]">
              <SectionHeading title="Projects" />
              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTab("all")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    tab === "all"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "border border-slate-900/15 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setTab("coding")}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    tab === "coding"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "border border-slate-900/15 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  Coding
                </button>
              </div>
              {!filteredRows.length ? (
                <p className="text-sm text-slate-500">No projects in this view.</p>
              ) : (
                <div>{filteredRows.map((row) => <ProjectRow key={row.projectId} row={row} />)}</div>
              )}
            </div>
          </div>
        </div>
        </>
      ) : null}
    </div>
  );
}
