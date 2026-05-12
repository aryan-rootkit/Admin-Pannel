import {
  API_ANALYTICS_FINANCE,
  API_ANALYTICS_MONTHLY,
  API_PEOPLE,
  getApiBase,
} from "@/lib/fetchApi";
import type {
  FinanceAnalytics,
  MonthlyAnalyticsRow,
  PayoutRow,
  PersonRow,
  Project,
  RevenueRow,
} from "@/types/api";

export type DashboardBundle = {
  projects: Project[];
  people: PersonRow[];
  revenues: RevenueRow[];
  payouts: PayoutRow[];
  finance: FinanceAnalytics | null;
  monthly: MonthlyAnalyticsRow[];
};

async function getJson<T>(path: string): Promise<T> {
  const base = getApiBase();
  const url = path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/** Single parallel fetch for the dashboard — ideal for SWR caching. */
export async function fetchDashboardBundle(): Promise<DashboardBundle> {
  getApiBase();
  const [proj, peop, rev, pay, fin, mon] = await Promise.all([
    getJson<Project[]>("/projects"),
    getJson<PersonRow[]>(API_PEOPLE),
    getJson<RevenueRow[]>("/revenues"),
    getJson<PayoutRow[]>("/payouts"),
    getJson<FinanceAnalytics>(API_ANALYTICS_FINANCE),
    getJson<MonthlyAnalyticsRow[]>(API_ANALYTICS_MONTHLY),
  ]);
  return {
    projects: Array.isArray(proj) ? proj : [],
    people: Array.isArray(peop) ? peop : [],
    revenues: Array.isArray(rev) ? rev : [],
    payouts: Array.isArray(pay) ? pay : [],
    finance: fin ?? null,
    monthly: Array.isArray(mon) ? mon : [],
  };
}

export const DASHBOARD_SWR_KEY = "dashboard-bundle" as const;
