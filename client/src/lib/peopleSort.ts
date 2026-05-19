import type { PersonRow, Project } from "@/types/api";
import { projectStatusBucket } from "@/lib/projectFinance";

export function buildProjectStatusMap(projects: Project[]): Map<string, string | undefined> {
  const m = new Map<string, string | undefined>();
  for (const p of projects) m.set(p._id, p.status);
  return m;
}

/** Active if assigned to at least one project whose status is Active. */
function statusForAssignment(
  ref: string | { _id: string; status?: string },
  projectStatusById: Map<string, string | undefined>
): string | undefined {
  if (typeof ref === "object" && ref.status != null && String(ref.status).trim()) {
    return ref.status;
  }
  const id = typeof ref === "string" ? ref : ref._id;
  return projectStatusById.get(id);
}

export function personHasActiveProject(
  person: PersonRow,
  projectStatusById: Map<string, string | undefined>
): boolean {
  const refs = person.assignedProjects ?? [];
  for (const ref of refs) {
    if (projectStatusBucket(statusForAssignment(ref, projectStatusById)) === "active") return true;
  }
  return false;
}

export function comparePeopleForList(
  a: PersonRow,
  b: PersonRow,
  projectStatusById: Map<string, string | undefined>
): number {
  const tierA = personHasActiveProject(a, projectStatusById) ? 0 : 1;
  const tierB = personHasActiveProject(b, projectStatusById) ? 0 : 1;
  if (tierA !== tierB) return tierA - tierB;

  const nameA = (a.name || a.email || "").toLowerCase();
  const nameB = (b.name || b.email || "").toLowerCase();
  return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
}

export function sortPeopleForList(
  people: PersonRow[],
  projectStatusById: Map<string, string | undefined>
): PersonRow[] {
  return [...people].sort((a, b) => comparePeopleForList(a, b, projectStatusById));
}
