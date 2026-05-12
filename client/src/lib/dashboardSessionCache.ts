import type {
  FinanceAnalytics,
  MonthlyAnalyticsRow,
  PayoutRow,
  PersonRow,
  Project,
  RevenueRow,
} from "@/types/api";

const STORAGE_KEY = "rk_dashboard_bundle_v1";
const MAX_AGE_MS = 90_000;

export type DashboardSessionPayload = {
  at: number;
  projects: Project[];
  people: PersonRow[];
  revenues: RevenueRow[];
  payouts: PayoutRow[];
  finance: FinanceAnalytics | null;
  monthly: MonthlyAnalyticsRow[];
};

function safeParse(raw: string | null): DashboardSessionPayload | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DashboardSessionPayload;
  } catch {
    return null;
  }
}

export function readDashboardSessionCache(): DashboardSessionPayload | null {
  if (typeof window === "undefined") return null;
  const row = safeParse(sessionStorage.getItem(STORAGE_KEY));
  if (!row || typeof row.at !== "number") return null;
  if (Date.now() - row.at > MAX_AGE_MS) return null;
  return row;
}

export function writeDashboardSessionCache(payload: Omit<DashboardSessionPayload, "at">): void {
  if (typeof window === "undefined") return;
  try {
    const body: DashboardSessionPayload = { ...payload, at: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(body));
  } catch {
    /* quota / private mode */
  }
}

export function clearDashboardSessionCache(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
