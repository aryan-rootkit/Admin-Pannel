/**
 * Shared revenue / payout rules for analytics and monthly reports.
 */

const RECEIVED = "Received";

function revenueLineAmount(doc) {
  const n = Number(doc.amount ?? doc.totalAmount ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function revenueLineStatus(doc) {
  const s = doc.status;
  if (s === "Received" || s === "Pending" || s === "Failed") return s;
  return RECEIVED;
}

function revenueLineDate(doc) {
  return doc.date || doc.paymentDate || doc.receivedAt || doc.createdAt;
}

/** Sum amount for accounting revenue (cash in) — only Received. */
function revenueReceivedAmount(doc) {
  return revenueLineStatus(doc) === RECEIVED ? revenueLineAmount(doc) : 0;
}

/**
 * Payouts treated as operating expenses (subscriptions, company-wide costs).
 * Matches payout `category` labels from the app + `type: subscription`.
 */
function isExpensePayout(p) {
  if (p.type === "subscription") return true;
  const cat = (p.category || "").trim().toLowerCase();
  if (cat === "subscriptions" || cat.includes("subscription")) return true;
  if (cat === "company expenses" || cat.includes("company expense")) return true;
  return false;
}

function payoutProjectCostAmount(p) {
  if (isExpensePayout(p)) return 0;
  return Number(p.amount) || 0;
}

function payoutExpenseAmount(p) {
  if (!isExpensePayout(p)) return 0;
  return Number(p.amount) || 0;
}

module.exports = {
  revenueLineAmount,
  revenueLineStatus,
  revenueLineDate,
  revenueReceivedAmount,
  isExpensePayout,
  payoutProjectCostAmount,
  payoutExpenseAmount,
};
