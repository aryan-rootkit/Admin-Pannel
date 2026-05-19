const { Revenue } = require("../revenues/model");
const { Payout } = require("../payouts/model");
const { PfTransaction } = require("./model");
const {
  revenueReceivedAmount,
  revenueLineDate,
  isExpensePayout,
} = require("../lib/financeHelpers");

function payoutLineDate(doc) {
  return doc.paymentDate || doc.paidAt || doc.createdAt;
}

function inRange(dateVal, start, end) {
  if (!dateVal) return false;
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (Number.isNaN(d.getTime())) return false;
  return d >= start && d < end;
}

/** Non-subscription payout tied to a project (dev, design, marketing, etc.). */
function isProjectLinkedPayout(p) {
  if (isExpensePayout(p)) return false;
  if (p.type === "subscription") return false;
  return Boolean(p.projectId);
}

async function sumRootkitIncomeLedger(start, end) {
  const rows = await PfTransaction.find({
    flow: "in",
    category: "rootkit_income",
    occurredAt: { $gte: start, $lt: end },
  })
    .select("amount category")
    .lean();
  let t = 0;
  for (const r of rows) {
    t += Number(r.amount) || 0;
  }
  return t;
}

/**
 * Company margin for a calendar month — aligns with Payouts "Left with Rootkit" (rev − project payouts).
 * @param {Date} start
 * @param {Date} end
 */
async function computeRootkitBusinessMonth(start, end) {
  const [revenues, payouts] = await Promise.all([
    Revenue.find()
      .select("amount totalAmount status paymentDate date receivedAt createdAt")
      .lean(),
    Payout.find()
      .select("amount projectId category type paymentDate paidAt createdAt")
      .lean(),
  ]);

  let revenueReceived = 0;
  let projectPayoutCost = 0;
  let operatingExpenses = 0;
  let projectPayoutLineCount = 0;

  for (const r of revenues) {
    if (!inRange(revenueLineDate(r), start, end)) continue;
    revenueReceived += revenueReceivedAmount(r);
  }

  for (const p of payouts) {
    if (!inRange(payoutLineDate(p), start, end)) continue;
    const amt = Math.max(0, Number(p.amount) || 0);
    if (!amt) continue;
    if (isProjectLinkedPayout(p)) {
      projectPayoutCost += amt;
      projectPayoutLineCount += 1;
    } else if (isExpensePayout(p)) {
      operatingExpenses += amt;
    }
  }

  const rootkitMargin = revenueReceived - projectPayoutCost;
  const rootkitNet = rootkitMargin - operatingExpenses;
  const ledgerRootkitIncome = await sumRootkitIncomeLedger(start, end);

  return {
    revenueReceived,
    projectPayoutCost,
    projectPayoutLineCount,
    operatingExpenses,
    rootkitMargin,
    rootkitNet,
    ledgerRootkitIncome,
  };
}

module.exports = { computeRootkitBusinessMonth };
