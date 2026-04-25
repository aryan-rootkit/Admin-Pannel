"use client";

import { useEffect, useState } from "react";
import {
  API_ANALYTICS_FINANCE,
  API_ANALYTICS_MONTHLY,
  API_PEOPLE,
  fetchJson,
  getApiBase,
} from "@/lib/fetchApi";
import type { FinanceAnalytics, MonthlyAnalyticsRow } from "@/types/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { DashboardInsights } from "@/components/dashboard/DashboardInsights";

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

  const [insightLoading, setInsightLoading] = useState(true);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [finance, setFinance] = useState<FinanceAnalytics | null>(null);
  const [monthly, setMonthly] = useState<MonthlyAnalyticsRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        getApiBase();
        const [clients, projects, people, revenues, payouts] = await Promise.all([
          fetchJson<unknown[]>("/clients"),
          fetchJson<unknown[]>("/projects"),
          fetchJson<unknown[]>(API_PEOPLE),
          fetchJson<unknown[]>("/revenues"),
          fetchJson<unknown[]>("/payouts"),
        ]);
        console.log("[dashboard] API rows:", {
          clients: clients.length,
          projects: projects.length,
          people: people.length,
          revenues: revenues.length,
          payouts: payouts.length,
        });
        if (!cancelled) {
          setCounts({
            clients: clients.length,
            projects: projects.length,
            peoples: people.length,
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        getApiBase();
        const [f, m] = await Promise.all([
          fetchJson<FinanceAnalytics>(API_ANALYTICS_FINANCE),
          fetchJson<MonthlyAnalyticsRow[]>(API_ANALYTICS_MONTHLY),
        ]);
        if (!cancelled) {
          setFinance(f);
          setMonthly(Array.isArray(m) ? m : []);
          setInsightError(null);
        }
      } catch (e) {
        if (!cancelled)
          setInsightError(
            e instanceof Error ? e.message : "Failed to load analytics"
          );
      } finally {
        if (!cancelled) setInsightLoading(false);
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

      <DashboardInsights
        finance={finance}
        monthly={monthly}
        loading={insightLoading}
        error={insightError}
      />
    </div>
  );
}
