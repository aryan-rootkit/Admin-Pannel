import type { AssignedProjectRef, PayoutRow, PersonRow, Project, RevenueRow } from "@/types/api";
import { projectStatusBucket } from "@/lib/projectFinance";
import { resolveClientName } from "@/lib/relations";

function refId(v: unknown): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "_id" in v) return String((v as { _id: string })._id);
  return "";
}

/** Sum payouts recorded for this person (matches dashboard “earnings” style totals). */
export function totalPayoutsForPerson(payouts: PayoutRow[], personId: string): number {
  let t = 0;
  for (const row of payouts) {
    if (row.type === "subscription") continue;
    const pid = refId(row.peopleId) || refId(row.personId);
    if (pid !== personId) continue;
    t += Number(row.amount) || 0;
  }
  return t;
}

export type PersonProjectMoneyRow = {
  projectId: string;
  projectName: string;
  clientLabel: string;
  payout: number;
  advance: number;
  pending: number;
  status?: string;
};

function payoutsForPersonProject(
  payouts: PayoutRow[],
  personId: string,
  projectId: string
): number {
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

function contractValue(project: Project | null | undefined): number {
  if (!project) return 0;
  return Math.max(0, Number(project.totalValue ?? project.budget ?? 0) || 0);
}

/** When the project has teamMemberShares, pending for a member = allocated − payouts on that project. */
function pendingForPersonOnProject(
  personId: string,
  projectId: string,
  projectDoc: Project | undefined,
  payouts: PayoutRow[],
  revenues: RevenueRow[]
): number {
  const shares = projectDoc?.teamMemberShares;
  const contract = contractValue(projectDoc);
  if (Array.isArray(shares) && shares.length > 0 && contract > 0) {
    const entry = shares.find((s) => refId(s.peopleId) === personId);
    if (entry) {
      const pct = Math.min(100, Math.max(0, Number(entry.sharePercent) || 0));
      const allocated = (contract * pct) / 100;
      const paid = payoutsForPersonProject(payouts, personId, projectId);
      return Math.max(0, allocated - paid);
    }
    return 0;
  }
  return revenueAdvancePendingForProject(revenues, projectId).pending;
}

function revenueAdvancePendingForProject(
  revenues: RevenueRow[],
  projectId: string
): { advance: number; pending: number } {
  let advance = 0;
  let pending = 0;
  for (const r of revenues) {
    if (refId(r.projectId) !== projectId) continue;
    const status = r.status || "Received";
    const pt = (r.paymentType || r.type || "").toString();
    const amt = Number(r.amount ?? r.totalAmount ?? 0) || 0;
    const pendLine = Number(r.pendingAmount ?? 0) || 0;

    if (status === "Pending") {
      pending += pendLine > 0 ? pendLine : amt;
      continue;
    }
    if (pt === "Advance") {
      advance += amt;
    }
  }
  return { advance, pending };
}

function projectFromAssigned(entry: AssignedProjectRef | string | unknown): Project | null {
  if (typeof entry === "string") {
    return { _id: entry, name: "", clientId: undefined, status: undefined } as unknown as Project;
  }
  if (!entry || typeof entry !== "object") return null;
  if (!("_id" in entry)) return null;
  return entry as unknown as Project;
}

export function buildPersonProjectMoneyRows(
  personId: string,
  assignedProjects: PersonRow["assignedProjects"],
  payouts: PayoutRow[],
  revenues: RevenueRow[],
  projects?: Project[]
): PersonProjectMoneyRow[] {
  const rows: PersonProjectMoneyRow[] = [];
  const list = Array.isArray(assignedProjects) ? assignedProjects : [];
  for (const raw of list) {
    const proj = projectFromAssigned(raw);
    if (!proj?._id) continue;
    const projectId = String(proj._id);
    const payout = payoutsForPersonProject(payouts, personId, projectId);
    const projectDoc = projects?.find((pr) => String(pr._id) === projectId);
    const { advance } = revenueAdvancePendingForProject(revenues, projectId);
    const pending = pendingForPersonOnProject(personId, projectId, projectDoc, payouts, revenues);
    rows.push({
      projectId,
      projectName: projectDoc?.name || proj.name || "—",
      clientLabel: resolveClientName(projectDoc?.clientId ?? proj.clientId),
      payout,
      advance,
      pending,
      status: projectDoc?.status ?? proj.status,
    });
  }
  return rows;
}

/** “Coding” tab = active pipeline work; All = full assigned list. */
export function filterProjectsTab(
  rows: PersonProjectMoneyRow[],
  tab: "all" | "coding"
): PersonProjectMoneyRow[] {
  if (tab === "all") return rows;
  return rows.filter((r) => projectStatusBucket(r.status) === "active");
}
