import type {
  AssignedProjectRef,
  PopulatedRef,
  Project,
  RevenueRow,
  PayoutRow,
} from "@/types/api";

export function resolveClientName(clientId: Project["clientId"]): string {
  if (typeof clientId === "object" && clientId && "name" in clientId) {
    return (clientId as PopulatedRef).name;
  }
  return typeof clientId === "string" ? clientId : "—";
}

export function resolveProjectName(projectId: RevenueRow["projectId"] | PayoutRow["projectId"]): string {
  if (typeof projectId === "object" && projectId && "name" in projectId) {
    return projectId.name;
  }
  return typeof projectId === "string" ? projectId : "—";
}

export function resolvePersonLabel(person: PayoutRow["personId"]): string {
  if (typeof person === "object" && person && "name" in person) {
    return person.role ? `${person.name} (${person.role})` : person.name;
  }
  return typeof person === "string" ? person : "—";
}

export function resolvePeopleLabel(people: PayoutRow["peopleId"]): string {
  if (typeof people === "object" && people && "name" in people) {
    return people.role ? `${people.name} (${people.role})` : people.name;
  }
  return typeof people === "string" ? people : "—";
}

export function resolveClientLabel(client: PayoutRow["clientId"]): string {
  if (typeof client === "object" && client && "name" in client) return client.name;
  if (typeof client === "string") return client;
  return "";
}

export function resolvePayoutPerson(p: PayoutRow): string {
  return resolvePeopleLabel(p.peopleId) !== "—"
    ? resolvePeopleLabel(p.peopleId)
    : resolvePersonLabel(p.personId);
}

export function resolveAssignedTeamNames(team: Project["assignedTeam"]): string {
  if (!team?.length) return "—";
  return (
    team
      .map((t) => (typeof t === "string" ? t : (t as PopulatedRef).name))
      .filter(Boolean)
      .join(", ") || "—"
  );
}

export function resolveAssignedProjectNames(
  projects: Array<AssignedProjectRef | string> | undefined
): string {
  if (!projects?.length) return "—";
  return (
    projects
      .map((p) => (typeof p === "string" ? p : p.name))
      .filter(Boolean)
      .join(", ") || "—"
  );
}
