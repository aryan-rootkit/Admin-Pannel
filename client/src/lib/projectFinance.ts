export type FinancialLifecycle = "Active" | "Completed" | "Cancelled";

/** Mirrors server `projectStatusBucket` for UI and client checks. */
export function projectStatusBucket(
  status?: string | null
): "active" | "completed" | "cancelled" {
  const s = String(status ?? "")
    .trim()
    .toLowerCase();
  if (!s) return "active";
  if (s === "cancelled" || s === "canceled" || s === "lost") return "cancelled";
  if (s === "completed" || s === "delivered") return "completed";
  return "active";
}

export function displayFinancialStatus(status?: string | null): FinancialLifecycle {
  const b = projectStatusBucket(status);
  if (b === "cancelled") return "Cancelled";
  if (b === "completed") return "Completed";
  return "Active";
}

export function projectReceivesNewPayments(status?: string | null): boolean {
  return projectStatusBucket(status) === "active";
}
