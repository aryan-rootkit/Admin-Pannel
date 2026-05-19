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
  if (s === "cancelled" || s === "canceled" || s === "lost") return "cancelled";
  if (s === "completed" || s === "delivered") return "completed";
  return "active";
}

/**
 * Only **active** projects accept new payment lines (completed/cancelled are closed books).
 * @param {string | undefined | null} status
 */
function projectReceivesNewPayments(status) {
  return projectStatusBucket(status) === "active";
}

function dateMs(iso) {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Active first; completed/cancelled last; completed ordered by completedAt desc. */
function compareProjectsForList(a, b) {
  function tier(status) {
    const bucket = projectStatusBucket(status);
    if (bucket === "active") return 0;
    if (bucket === "completed") return 1;
    return 2;
  }
  const tierA = tier(a.status);
  const tierB = tier(b.status);
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
  return String(a.name || "").localeCompare(String(b.name || ""), undefined, {
    sensitivity: "base",
  });
}

module.exports = {
  projectStatusBucket,
  projectReceivesNewPayments,
  compareProjectsForList,
};
