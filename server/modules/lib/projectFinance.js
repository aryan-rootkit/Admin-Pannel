/**
 * Normalizes project lifecycle for revenue / finance rules.
 * Maps legacy CRM statuses onto Active | Completed | Cancelled.
 *
 * @param {string | undefined | null} status
 * @returns {"active" | "completed" | "cancelled"}
 */
function projectStatusBucket(status) {
  const s = String(status ?? "")
    .trim()
    .toLowerCase();
  if (!s) return "active";
  if (s === "cancelled" || s === "lost") return "cancelled";
  if (s === "completed" || s === "delivered") return "completed";
  return "active";
}

/**
 * @param {string | undefined | null} status
 */
function projectReceivesNewPayments(status) {
  return projectStatusBucket(status) !== "cancelled";
}

module.exports = { projectStatusBucket, projectReceivesNewPayments };
