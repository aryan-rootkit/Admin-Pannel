import type { TeamMemberShare } from "@/types/api";

export function sumSharePercents(shares: TeamMemberShare[]): number {
  if (!Array.isArray(shares)) return 0;
  return shares.reduce((s, r) => s + Math.min(100, Math.max(0, Number(r.sharePercent) || 0)), 0);
}

export function validateTeamShares(shares: TeamMemberShare[]): string | null {
  const sum = sumSharePercents(shares);
  if (sum > 100.01) return "Percentages cannot add up to more than 100% of contract value.";
  return null;
}

export function allocatedFromPercent(contract: number, percent: number): number {
  const c = Math.max(0, contract);
  const p = Math.min(100, Math.max(0, Number(percent) || 0));
  return (c * p) / 100;
}

export function consultancyPercent(shares: TeamMemberShare[]): number {
  return Math.max(0, 100 - sumSharePercents(shares));
}
