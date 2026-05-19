import type { Project } from "@/types/api";
import { projectStatusBucket } from "@/lib/projectFinance";

function tierForProject(status?: string | null): number {
  const bucket = projectStatusBucket(status);
  if (bucket === "active") return 0;
  if (bucket === "completed") return 1;
  return 2;
}

function dateMs(iso?: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Active projects first; completed/cancelled last; completed ranked by completion date. */
export function compareProjectsForList(a: Project, b: Project): number {
  const tierA = tierForProject(a.status);
  const tierB = tierForProject(b.status);
  if (tierA !== tierB) return tierA - tierB;

  if (tierA === 1) {
    const byCompleted = dateMs(b.completedAt) - dateMs(a.completedAt);
    if (byCompleted !== 0) return byCompleted;
  }

  if (tierA === 0) {
    const byActivity =
      Math.max(dateMs(b.updatedAt), dateMs(b.createdAt)) -
      Math.max(dateMs(a.updatedAt), dateMs(a.createdAt));
    if (byActivity !== 0) return byActivity;
  }

  return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
}

export function sortProjectsForList(projects: Project[]): Project[] {
  return [...projects].sort(compareProjectsForList);
}
