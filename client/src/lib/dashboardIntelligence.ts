import { projectStatusBucket } from "@/lib/projectFinance";
import type {
  FinanceAnalytics,
  MonthlyAnalyticsRow,
  PayoutRow,
  Project,
  RevenueRow,
  PersonRow,
} from "@/types/api";

export type MomMeta = {
  current: number;
  previous: number;
  /** Percent change previous → current; null if previous is 0 */
  pct: number | null;
};

function momFromSeries(
  current: number,
  previous: number
): Pick<MomMeta, "pct"> {
  if (previous === 0) return { pct: current > 0 ? 100 : null };
  return { pct: ((current - previous) / previous) * 100 };
}

export function monthlyMomTriple(monthly: MonthlyAnalyticsRow[]): {
  revenue: MomMeta;
  cost: MomMeta;
  profit: MomMeta;
} {
  const m = Array.isArray(monthly) ? monthly : [];
  if (m.length < 2) {
    const z = { current: 0, previous: 0, pct: null as number | null };
    return { revenue: { ...z }, cost: { ...z }, profit: { ...z } };
  }
  const curr = m[m.length - 1];
  const prev = m[m.length - 2];
  const revenue = {
    current: curr.revenue,
    previous: prev.revenue,
    ...momFromSeries(curr.revenue, prev.revenue),
  };
  const cost = {
    current: curr.cost,
    previous: prev.cost,
    ...momFromSeries(curr.cost, prev.cost),
  };
  const profit = {
    current: curr.profit,
    previous: prev.profit,
    ...momFromSeries(curr.profit, prev.profit),
  };
  return { revenue, cost, profit };
}

function revenueLineAmount(r: RevenueRow): number {
  return Number(r.amount ?? r.totalAmount ?? 0) || 0;
}

function revenueStatus(r: RevenueRow): string {
  const s = r.status || "Received";
  return s;
}

function revenueLineDateMs(r: RevenueRow): number | null {
  const raw = r.date || r.paymentDate || r.receivedAt;
  if (!raw) return null;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Pending lines whose scheduled date is in the past → collections attention */
export function overduePendingRevenues(revenues: RevenueRow[]): {
  count: number;
  amount: number;
} {
  const now = Date.now();
  let count = 0;
  let amount = 0;
  for (const r of revenues) {
    if (revenueStatus(r) !== "Pending") continue;
    const ms = revenueLineDateMs(r);
    if (ms == null || ms > now) continue;
    count += 1;
    amount += revenueLineAmount(r);
  }
  return { count, amount };
}

export function projectStatusCounts(projects: Project[]): {
  active: number;
  completed: number;
  cancelled: number;
} {
  let active = 0;
  let completed = 0;
  let cancelled = 0;
  for (const p of projects) {
    const b = projectStatusBucket(p.status);
    if (b === "cancelled") cancelled += 1;
    else if (b === "completed") completed += 1;
    else active += 1;
  }
  return { active, completed, cancelled };
}

const STALL_MS = 14 * 24 * 60 * 60 * 1000;

export function stalledActiveProjects(projects: Project[]): Project[] {
  const cutoff = Date.now() - STALL_MS;
  return projects.filter((p) => {
    if (projectStatusBucket(p.status) !== "active") return false;
    const raw = (p as Project & { updatedAt?: string }).updatedAt;
    if (!raw) return false;
    const t = new Date(raw).getTime();
    if (Number.isNaN(t)) return false;
    return t < cutoff;
  });
}

export function highPendingProjects(
  finance: FinanceAnalytics | null,
  limit = 5
): Array<{ projectId: string; projectName: string; pending: number }> {
  const rows = finance?.projectBreakdown ?? [];
  return [...rows]
    .filter((r) => r.pending > 0)
    .sort((a, b) => b.pending - a.pending)
    .slice(0, limit)
    .map((r) => ({
      projectId: r.projectId,
      projectName: r.projectName || "—",
      pending: r.pending,
    }));
}

export type ActivityKind = "revenue" | "payout" | "project";

export type ActivityItem = {
  id: string;
  at: number;
  kind: ActivityKind;
  title: string;
  detail: string;
};

function formatMoneyBrief(n: number): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return String(n);
  }
}

function projectNameFromRef(pid: RevenueRow["projectId"]): string {
  if (typeof pid === "object" && pid?.name) return pid.name;
  return "";
}

function revenueActivityTime(r: RevenueRow): number | null {
  const line = revenueLineDateMs(r);
  if (line != null) return line;
  if (!r.createdAt) return null;
  const t = new Date(r.createdAt).getTime();
  return Number.isNaN(t) ? null : t;
}

export function buildActivityFeed(params: {
  revenues: RevenueRow[];
  payouts: PayoutRow[];
  projects: Project[];
  limit?: number;
}): ActivityItem[] {
  const limit = params.limit ?? 14;
  const items: ActivityItem[] = [];

  for (const r of params.revenues) {
    const at = revenueActivityTime(r);
    if (at == null) continue;
    const st = revenueStatus(r);
    const proj = projectNameFromRef(r.projectId) || "Project";
    const amt = revenueLineAmount(r);
    items.push({
      id: `rev-${r._id}`,
      at,
      kind: "revenue",
      title:
        st === "Received"
          ? `Payment received · ${proj}`
          : st === "Pending"
            ? `Payment pending · ${proj}`
            : `Payment line · ${proj}`,
      detail: amt > 0 ? `₹${amt.toLocaleString("en-IN")}` : st,
    });
  }

  for (const p of params.payouts) {
    const raw = p.paymentDate || p.paidAt || (p as { createdAt?: string }).createdAt;
    const at = raw ? new Date(raw).getTime() : 0;
    if (!at) continue;
    const related =
      typeof p.projectId === "object" && p.projectId?.name
        ? p.projectId.name
        : "Payout";
    items.push({
      id: `pay-${p._id}`,
      at,
      kind: "payout",
      title: `Payout processed · ${related}`,
      detail: formatMoneyBrief(Number(p.amount) || 0),
    });
  }

  for (const p of params.projects) {
    const raw = (p as Project & { createdAt?: string }).createdAt;
    const at = raw ? new Date(raw).getTime() : 0;
    if (!at) continue;
    items.push({
      id: `proj-${p._id}`,
      at,
      kind: "project",
      title: `Project · ${p.name || "Untitled"}`,
      detail: projectStatusBucket(p.status) === "active" ? "Active" : p.status || "—",
    });
  }

  items.sort((a, b) => b.at - a.at);
  return items.slice(0, limit);
}

export function topPeopleByPayout(
  payouts: PayoutRow[],
  people: PersonRow[],
  limit = 4
): Array<{ id: string; name: string; total: number }> {
  const nameById = new Map<string, string>();
  for (const p of people) {
    nameById.set(p._id, p.name || p.email || p._id);
  }
  const sums = new Map<string, number>();
  for (const row of payouts) {
    if (row.type === "subscription") continue;
    const pid =
      (typeof row.peopleId === "string"
        ? row.peopleId
        : row.peopleId?._id) ||
      (typeof row.personId === "string" ? row.personId : row.personId?._id);
    if (!pid) continue;
    const amt = Number(row.amount) || 0;
    sums.set(pid, (sums.get(pid) || 0) + amt);
  }
  return [...sums.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, total]) => ({
      id,
      name: nameById.get(id) || id,
      total,
    }));
}

export function smartSummaryLines(params: {
  mom: ReturnType<typeof monthlyMomTriple>;
  overdue: ReturnType<typeof overduePendingRevenues>;
  status: ReturnType<typeof projectStatusCounts>;
  finance: FinanceAnalytics | null;
  stalledCount: number;
  burn?: {
    runwayMonthsFromPending: number | null;
    monthlyBurn: number;
  } | null;
}): string[] {
  const lines: string[] = [];
  const revPct = params.mom.revenue.pct;
  if (revPct != null) {
    const sign = revPct >= 0 ? "increased" : "decreased";
    lines.push(
      `This month: Received revenue ${sign} by ${Math.abs(revPct).toFixed(1)}% vs last month`
    );
  }
  if (params.overdue.count > 0) {
    lines.push(
      `${params.overdue.count} overdue pending payment line${params.overdue.count === 1 ? "" : "s"} (${formatMoneyBrief(params.overdue.amount)} exposure)`
    );
  }
  lines.push(
    `${params.status.active} active · ${params.status.completed} completed · ${params.status.cancelled} cancelled projects`
  );
  if (params.stalledCount > 0) {
    lines.push(`${params.stalledCount} active project${params.stalledCount === 1 ? "" : "s"} with no updates in 14+ days`);
  }
  if (params.finance) {
    lines.push(
      `Net profit (after subscriptions & expenses): ${formatMoneyBrief(params.finance.netProfit)}`
    );
  }
  if (params.burn && params.burn.runwayMonthsFromPending != null && Number.isFinite(params.burn.runwayMonthsFromPending)) {
    lines.push(
      `Runway signal: ~${params.burn.runwayMonthsFromPending.toFixed(1)} months of pending revenue at ${formatMoneyBrief(params.burn.monthlyBurn)} monthly burn (heuristic)`
    );
  }
  return lines.slice(0, 6);
}
