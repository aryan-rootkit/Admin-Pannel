import { computeBurnRunwayIntel, type BurnRunwayIntel } from "@/lib/dashboardBurn";
import type { DashboardBundle } from "@/lib/fetchDashboardBundle";
import {
  buildActivityFeed,
  highPendingProjects,
  monthlyMomTriple,
  overduePendingRevenues,
  projectStatusCounts,
  smartSummaryLines,
  stalledActiveProjects,
  topPeopleByPayout,
} from "@/lib/dashboardIntelligence";
import { formatMoney } from "@/lib/format";
import type {
  FinanceAnalytics,
  MonthlyAnalyticsRow,
  PayoutRow,
  PersonRow,
  Project,
  RevenueRow,
} from "@/types/api";

export type DashboardModel = {
  projects: Project[];
  people: PersonRow[];
  revenues: RevenueRow[];
  payouts: PayoutRow[];
  finance: FinanceAnalytics | null;
  monthly: MonthlyAnalyticsRow[];
  mom: ReturnType<typeof monthlyMomTriple>;
  overdue: ReturnType<typeof overduePendingRevenues>;
  status: ReturnType<typeof projectStatusCounts>;
  stalled: Project[];
  activity: ReturnType<typeof buildActivityFeed>;
  topPaid: ReturnType<typeof topPeopleByPayout>;
  burnIntel: BurnRunwayIntel | null;
  summaryLines: ReturnType<typeof smartSummaryLines>;
  highPendingLabel: string;
  statusSlices: { name: string; value: number; fill: string }[];
  activeWithProjects: number;
};

export function buildDashboardModel(data: DashboardBundle | undefined): DashboardModel {
  const projects = data?.projects ?? [];
  const people = data?.people ?? [];
  const revenues = data?.revenues ?? [];
  const payouts = data?.payouts ?? [];
  const finance = data?.finance ?? null;
  const monthly = data?.monthly ?? [];

  const mom = monthlyMomTriple(monthly);
  const overdue = overduePendingRevenues(revenues);
  const status = projectStatusCounts(projects);
  const stalled = stalledActiveProjects(projects);
  const activity = buildActivityFeed({ revenues, payouts, projects, limit: 14 });
  const topPaid = topPeopleByPayout(payouts, people, 4);
  const burnIntel = computeBurnRunwayIntel(finance, monthly, mom.cost);
  const summaryLines = smartSummaryLines({
    mom,
    overdue,
    status,
    finance,
    stalledCount: stalled.length,
  });

  const top = highPendingProjects(finance, 1)[0];
  const highPendingLabel = !top
    ? "No outsized pending buckets"
    : `${top.projectName} · ${formatMoney(top.pending, "INR")}`;

  const statusSlices = [
    { name: "Active", value: status.active, fill: "#2563eb" },
    { name: "Completed", value: status.completed, fill: "#16a34a" },
    { name: "Cancelled", value: status.cancelled, fill: "#e11d48" },
  ];

  const activeWithProjects = people.filter(
    (p) => Array.isArray(p.assignedProjects) && p.assignedProjects.length > 0
  ).length;

  return {
    projects,
    people,
    revenues,
    payouts,
    finance,
    monthly,
    mom,
    overdue,
    status,
    stalled,
    activity,
    topPaid,
    burnIntel,
    summaryLines,
    highPendingLabel,
    statusSlices,
    activeWithProjects,
  };
}
