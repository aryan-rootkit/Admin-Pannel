"use client";

import { useEffect, useState } from "react";
import { fetchJson, getApiBase } from "@/lib/fetchApi";
import { PageHeader } from "@/components/layout/PageHeader";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    clients: 0,
    projects: 0,
    peoples: 0,
    revenues: 0,
    payouts: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        getApiBase();
        const [clients, projects, teams, revenues, payouts] = await Promise.all([
          fetchJson<unknown[]>("/clients"),
          fetchJson<unknown[]>("/projects"),
          fetchJson<unknown[]>("/teams"),
          fetchJson<unknown[]>("/revenues"),
          fetchJson<unknown[]>("/payouts"),
        ]);
        console.log("[dashboard] API rows:", {
          clients: clients.length,
          projects: projects.length,
          teams: teams.length,
          revenues: revenues.length,
          payouts: payouts.length,
        });
        if (!cancelled) {
          setCounts({
            clients: clients.length,
            projects: projects.length,
            peoples: teams.length,
            revenues: revenues.length,
            payouts: payouts.length,
          });
          setError(null);
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tiles = [
    { label: "Clients", value: counts.clients },
    { label: "Projects", value: counts.projects },
    { label: "Peoples", value: counts.peoples },
    { label: "Revenues", value: counts.revenues },
    { label: "Payouts", value: counts.payouts },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--purity-muted)]">
          <Spinner />
          Loading…
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="rounded-xl border border-[var(--purity-border)] bg-[var(--purity-card)] p-5 shadow-sm"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--purity-muted)]">
                {t.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--purity-text)]">{t.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
